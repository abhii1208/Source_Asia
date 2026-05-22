"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RescheduleModal from "@/components/bookings/RescheduleModal";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import {
  isUuid,
  mapAlternativeFlightRow,
  mapBookingRow,
  mapRescheduleRows,
  mapSeatRow,
  type AlternativeFlightRow,
  type AlternativeSeatRow,
  type BookingRow,
  type FlightNoRow,
  type RescheduleRow
} from "@/lib/booking-data";
import { setCachedBookings, useUserStore } from "@/store/useUserStore";
import type { BookingWithDetails, RescheduleOption, RescheduleRecord, SeatSummary } from "@/lib/types";

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
};

export default function BookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const userStore = useUserStore();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleOption[]>([]);
  const [seatOptions, setSeatOptions] = useState<SeatSummary[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const bookingId = params.bookingId ?? "";

  const estimatedFee = useMemo(() => {
    if (!booking || !selectedFlightId || !selectedSeatId) {
      return 0;
    }

    const selectedFlight = rescheduleOptions.find((option) => option.flightId === selectedFlightId);
    const selectedSeat = seatOptions.find((seat) => seat.id === selectedSeatId);

    if (!selectedFlight || !selectedSeat) {
      return 0;
    }

    const newTotal = selectedFlight.basePrice + selectedSeat.extraFee;
    return Math.max(0, newTotal - booking.totalPrice);
  }, [booking, rescheduleOptions, seatOptions, selectedFlightId, selectedSeatId]);

  useEffect(() => {
    if (!isUuid(bookingId)) {
      setError("Invalid booking ID.");
      setLoading(false);
      return;
    }

    void fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  function syncBookingToCache(nextBooking: BookingWithDetails) {
    const existing = userStore.cachedBookings;
    const index = existing.findIndex((item) => item.id === nextBooking.id);

    if (index === -1) {
      setCachedBookings([nextBooking, ...existing]);
      return;
    }

    const next = [...existing];
    next[index] = nextBooking;
    setCachedBookings(next);
  }

  async function fetchBookingDetails() {
    const envError = getSupabaseBrowserClientError();
    if (envError) {
      setError(envError);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase client is not available.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace(`/auth/login?redirect=/my-bookings/${bookingId}`);
      return;
    }

    const bookingResponse = await supabase
      .from("bookings")
      .select(
        "id, status, booked_at, total_price, pnr_code, flights:flight_id(id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price), seats:seat_id(id, seat_number, class, extra_fee, is_available), passengers(id, full_name, nationality, dob)"
      )
      .eq("id", bookingId)
      .single<BookingRow>();

    if (bookingResponse.error || !bookingResponse.data) {
      setError("Booking not found.");
      setLoading(false);
      return;
    }

    const rescheduleResponse = await supabase
      .from("reschedules")
      .select("id, booking_id, old_flight_id, new_flight_id, requested_at, fee_charged")
      .eq("booking_id", bookingId)
      .order("requested_at", { ascending: false });

    let mappedReschedules: RescheduleRecord[] = [];

    if (!rescheduleResponse.error) {
      const rows = (rescheduleResponse.data ?? []) as RescheduleRow[];
      const flightIds = Array.from(
        new Set(rows.flatMap((row) => [row.old_flight_id, row.new_flight_id]).filter((id) => Boolean(id)))
      );

      if (flightIds.length > 0) {
        const flightNoResponse = await supabase
          .from("flights")
          .select("id, flight_no")
          .in("id", flightIds);

        const flightNos = (flightNoResponse.data ?? []) as FlightNoRow[];
        mappedReschedules = mapRescheduleRows(rows, flightNos);
      } else {
        mappedReschedules = [];
      }
    }

    const mappedBooking = mapBookingRow(bookingResponse.data, mappedReschedules);
    if (!mappedBooking) {
      setError("Unable to load booking details.");
      setLoading(false);
      return;
    }

    setBooking(mappedBooking);
    syncBookingToCache(mappedBooking);
    setLoading(false);
  }

  async function cancelBooking() {
    if (!booking) {
      return;
    }

    setCancelSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const response = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ booking_id: booking.id })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      setError(payload?.message ?? "Unable to cancel booking right now.");
      setCancelSubmitting(false);
      setCancelOpen(false);
      return;
    }

    const nextBooking: BookingWithDetails = {
      ...booking,
      status: "cancelled"
    };

    setBooking(nextBooking);
    syncBookingToCache(nextBooking);
    setSuccessMessage("Booking cancelled successfully.");
    setCancelSubmitting(false);
    setCancelOpen(false);
  }

  async function openReschedule() {
    if (!booking) {
      return;
    }

    setRescheduleOpen(true);
    setRescheduleOptions([]);
    setSeatOptions([]);
    setSelectedFlightId(null);
    setSelectedSeatId(null);
    setRescheduleError(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setRescheduleError("Supabase client is not available.");
      return;
    }

    setLoadingOptions(true);

    const { data, error: optionsError } = await supabase
      .from("flights")
      .select("id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price")
      .eq("origin", booking.flight.origin)
      .eq("destination", booking.flight.destination)
      .neq("id", booking.flight.id)
      .gte("departs_at", new Date().toISOString())
      .order("departs_at", { ascending: true });

    if (optionsError) {
      setRescheduleError("Unable to load alternative flights right now.");
      setLoadingOptions(false);
      return;
    }

    const mapped = ((data ?? []) as AlternativeFlightRow[]).map((row) =>
      mapAlternativeFlightRow(row, booking.totalPrice)
    );

    setRescheduleOptions(mapped);
    setLoadingOptions(false);
  }

  async function handleSelectFlight(flightId: string) {
    setSelectedFlightId(flightId);
    setSelectedSeatId(null);
    setSeatOptions([]);
    setRescheduleError(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setRescheduleError("Supabase client is not available.");
      return;
    }

    setLoadingSeats(true);

    const { data, error: seatsError } = await supabase
      .from("seats")
      .select("id, seat_number, class, extra_fee, is_available")
      .eq("flight_id", flightId)
      .eq("is_available", true)
      .order("seat_number", { ascending: true });

    if (seatsError) {
      setRescheduleError("Unable to load available seats right now.");
      setLoadingSeats(false);
      return;
    }

    const mappedSeats = ((data ?? []) as AlternativeSeatRow[]).map(mapSeatRow);
    setSeatOptions(mappedSeats);
    setLoadingSeats(false);
  }

  async function confirmReschedule() {
    if (!booking || !selectedFlightId || !selectedSeatId) {
      return;
    }

    setRescheduleSubmitting(true);
    setRescheduleError(null);
    setSuccessMessage(null);

    const response = await fetch("/api/bookings/reschedule", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        booking_id: booking.id,
        new_flight_id: selectedFlightId,
        new_seat_id: selectedSeatId
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      setRescheduleError(payload?.message ?? "Unable to reschedule booking right now.");
      setRescheduleSubmitting(false);
      return;
    }

    await fetchBookingDetails();
    setSuccessMessage("Booking rescheduled successfully.");
    setRescheduleSubmitting(false);
    setRescheduleOpen(false);
    setSelectedFlightId(null);
    setSelectedSeatId(null);
    setSeatOptions([]);
    setRescheduleOptions([]);
  }

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-gutter py-10 space-y-4">
        <LoadingSkeleton className="h-[120px] w-full" />
        <LoadingSkeleton className="h-[260px] w-full" />
        <LoadingSkeleton className="h-[180px] w-full" />
      </section>
    );
  }

  if (error && !booking) {
    return (
      <section className="max-w-4xl mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <p className="text-on-surface mb-3">{error}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void fetchBookingDetails()}
              className="rounded-xl bg-primary text-on-primary px-5 py-2 focus-ring"
            >
              Retry
            </button>
            <Link href="/my-bookings" className="rounded-xl border border-outline px-5 py-2 focus-ring">
              Back to My Bookings
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="max-w-4xl mx-auto px-gutter py-12">
        <p>Booking not found.</p>
        <Link href="/my-bookings" className="text-primary hover:underline">
          Back to My Bookings
        </Link>
      </section>
    );
  }

  const canEdit = booking.status !== "cancelled";

  return (
    <section className="max-w-5xl mx-auto px-gutter py-10">
      {error ? (
        <div className="mb-4 rounded-xl border border-error/40 bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-xl border border-primary/40 bg-primary-container/20 px-4 py-3 text-sm text-primary">
          {successMessage}
        </div>
      ) : null}

      <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg">Booking {booking.id}</h1>
            <p className="text-on-surface-variant">PNR: {booking.pnrCode}</p>
            <p className="text-on-surface-variant text-sm">Booked at: {formatDateTime(booking.bookedAt)}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <h2 className="font-headline-md text-headline-md mb-2">Passengers</h2>
            <div className="space-y-3">
              {booking.passengers.map((passenger) => (
                <div key={passenger.id}>
                  <p className="text-on-surface">{passenger.fullName}</p>
                  <p className="text-on-surface-variant text-sm">Nationality: {passenger.nationality}</p>
                  <p className="text-on-surface-variant text-sm">DOB: {passenger.dateOfBirth}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <h2 className="font-headline-md text-headline-md mb-2">Current Flight</h2>
            <p>
              {booking.flight.origin} to {booking.flight.destination}
            </p>
            <p className="text-on-surface-variant">Flight: {booking.flight.flightNo}</p>
            <p className="text-on-surface-variant">Departure: {formatDateTime(booking.flight.departsAt)}</p>
            <p className="text-on-surface-variant">Arrival: {formatDateTime(booking.flight.arrivesAt)}</p>
            <p className="text-on-surface-variant">Aircraft: {booking.flight.aircraftType}</p>
            <p className="text-on-surface-variant">Seat: {booking.seat.seatNumber}</p>
            <p className="text-on-surface-variant">Seat Class: {booking.seat.seatClass}</p>
            <p className="text-on-surface-variant">Total: {formatCurrency(booking.totalPrice)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 mt-5">
          <h2 className="font-headline-md text-headline-md mb-3">Reschedule History</h2>
          {booking.reschedules.length === 0 ? (
            <p className="text-on-surface-variant">No reschedule events recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {booking.reschedules.map((item) => (
                <li key={item.id} className="border border-outline-variant/35 rounded-xl p-3">
                  <p className="text-on-surface">
                    {item.oldFlightNo} to {item.newFlightNo}
                  </p>
                  <p className="text-on-surface-variant text-sm">Requested: {formatDateTime(item.requestedAt)}</p>
                  <p className="text-on-surface-variant text-sm">Fee Charged: {formatCurrency(item.feeCharged)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {canEdit ? (
            <button
              type="button"
              onClick={() => void openReschedule()}
              className="rounded-xl bg-primary text-on-primary px-5 py-3 hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
            >
              Reschedule
            </button>
          ) : null}

          {canEdit ? (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="rounded-xl border border-error text-error px-5 py-3 hover:bg-error hover:text-on-error transition-colors focus-ring"
            >
              Cancel Booking
            </button>
          ) : null}

          <Link
            href="/my-bookings"
            className="rounded-xl border border-outline text-on-surface px-5 py-3 hover:bg-surface-container-low transition-colors focus-ring"
          >
            Back to My Bookings
          </Link>
        </div>
      </div>

      {cancelOpen ? (
        <div className="fixed inset-0 z-[65] bg-black/35 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="glass-panel rounded-2xl p-6 shadow-glass max-w-md w-full">
            <h3 className="font-headline-md text-headline-md">Cancel booking?</h3>
            <p className="text-on-surface-variant mt-2">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                disabled={cancelSubmitting}
                className="rounded-xl border border-outline px-4 py-2 hover:bg-surface-container-low transition-colors focus-ring disabled:opacity-60"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => void cancelBooking()}
                disabled={cancelSubmitting}
                className="rounded-xl bg-error text-on-error px-4 py-2 hover:opacity-90 transition-opacity focus-ring disabled:opacity-60"
              >
                {cancelSubmitting ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <RescheduleModal
        open={rescheduleOpen}
        currentFlightNo={booking.flight.flightNo}
        options={rescheduleOptions}
        seatOptions={seatOptions}
        selectedFlightId={selectedFlightId}
        selectedSeatId={selectedSeatId}
        feeCharged={estimatedFee}
        loadingOptions={loadingOptions}
        loadingSeats={loadingSeats}
        submitting={rescheduleSubmitting}
        error={rescheduleError}
        onClose={() => {
          if (!rescheduleSubmitting) {
            setRescheduleOpen(false);
            setSelectedFlightId(null);
            setSelectedSeatId(null);
            setSeatOptions([]);
            setRescheduleOptions([]);
            setRescheduleError(null);
          }
        }}
        onSelectFlight={handleSelectFlight}
        onSelectSeat={setSelectedSeatId}
        onConfirm={confirmReschedule}
      />
    </section>
  );
}
