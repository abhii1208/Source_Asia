"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BookingCard from "@/components/bookings/BookingCard";
import RescheduleModal from "@/components/bookings/RescheduleModal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import {
  mapAlternativeFlightRow,
  mapBookingRow,
  mapSeatRow,
  type AlternativeFlightRow,
  type AlternativeSeatRow,
  type BookingRow
} from "@/lib/booking-data";
import { useFlightStore } from "@/store/useFlightStore";
import { setCachedBookings, useUserStore } from "@/store/useUserStore";
import type { BookingWithDetails, RescheduleOption, SeatSummary } from "@/lib/types";

type BookingTab = "upcoming" | "past" | "cancelled";

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
};

export default function MyBookingsPage() {
  const router = useRouter();
  const cachedBookings = useUserStore((state) => state.cachedBookings);
  const lastSyncedAt = useUserStore((state) => state.lastSyncedAt);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [usingCachedFallback, setUsingCachedFallback] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<BookingWithDetails | null>(null);
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleOption[]>([]);
  const [seatOptions, setSeatOptions] = useState<SeatSummary[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const estimatedFee = useMemo(() => {
    if (!rescheduleTarget || !selectedFlightId || !selectedSeatId) {
      return 0;
    }

    const selectedFlight = rescheduleOptions.find((option) => option.flightId === selectedFlightId);
    const selectedSeat = seatOptions.find((seat) => seat.id === selectedSeatId);

    if (!selectedFlight || !selectedSeat) {
      return 0;
    }

    const newTotal = selectedFlight.basePrice + selectedSeat.extraFee;
    return Math.max(0, newTotal - rescheduleTarget.totalPrice);
  }, [rescheduleOptions, rescheduleTarget, seatOptions, selectedFlightId, selectedSeatId]);

  const now = Date.now();

  const visibleBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const isPast = new Date(booking.flight.departsAt).getTime() < now;

      if (activeTab === "cancelled") {
        return booking.status === "cancelled";
      }

      if (activeTab === "past") {
        return isPast && booking.status !== "cancelled";
      }

      return !isPast && booking.status !== "cancelled";
    });
  }, [bookings, activeTab, now]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncOnlineState = () => setIsOnline(window.navigator.onLine);
    syncOnlineState();

    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    void fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOnline && usingCachedFallback) {
      void fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, usingCachedFallback]);

  async function fetchBookings() {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setUsingCachedFallback(true);
      setError(null);
      setBookings(cachedBookings);
      setLoading(false);
      return;
    }

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
      router.replace("/auth/login?redirect=/my-bookings");
      return;
    }

    const { data, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, status, booked_at, total_price, pnr_code, flights:flight_id(id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price), seats:seat_id(id, seat_number, class, extra_fee, is_available), passengers(id, full_name, nationality, dob)"
      )
      .order("booked_at", { ascending: false });

    if (bookingError) {
      if (cachedBookings.length > 0) {
        setBookings(cachedBookings);
        setUsingCachedFallback(true);
        setError("Live data is unavailable right now. Showing last synced bookings.");
      } else {
        setError("Unable to load your bookings right now. Please try again.");
      }
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as BookingRow[];
    const mapped = rows
      .map((row) => mapBookingRow(row, []))
      .filter((booking): booking is BookingWithDetails => Boolean(booking));

    setBookings(mapped);
    setCachedBookings(mapped);
    setUsingCachedFallback(false);
    setLoading(false);
  }

  async function cancelBooking() {
    if (!cancelTarget) {
      return;
    }

    setCancelLoadingId(cancelTarget);
    setError(null);
    setSuccessMessage(null);

    const response = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ booking_id: cancelTarget })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      setError(payload?.message ?? "Unable to cancel booking right now.");
      setCancelLoadingId(null);
      setCancelTarget(null);
      return;
    }

    const nextBookings: BookingWithDetails[] = bookings.map((booking) =>
      booking.id === cancelTarget
        ? {
            ...booking,
            status: "cancelled" as const
          }
        : booking
    );

    setBookings(nextBookings);
    setCachedBookings(nextBookings);
    useFlightStore.getState().resetBookingFlow();
    setSuccessMessage("Booking cancelled successfully.");
    setCancelLoadingId(null);
    setCancelTarget(null);
  }

  async function openReschedule(bookingId: string) {
    const booking = bookings.find((row) => row.id === bookingId);
    if (!booking) {
      return;
    }

    setRescheduleTarget(booking);
    setRescheduleOptions([]);
    setSeatOptions([]);
    setSelectedFlightId(null);
    setSelectedSeatId(null);
    setRescheduleError(null);

    const envError = getSupabaseBrowserClientError();
    if (envError) {
      setRescheduleError(envError);
      return;
    }

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
    if (!rescheduleTarget || !selectedFlightId || !selectedSeatId) {
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
        booking_id: rescheduleTarget.id,
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

    await fetchBookings();
    setRescheduleSubmitting(false);
    setRescheduleTarget(null);
    setSelectedFlightId(null);
    setSelectedSeatId(null);
    setSeatOptions([]);
    setRescheduleOptions([]);
    setSuccessMessage("Booking rescheduled successfully.");
  }

  function closeRescheduleModal() {
    if (rescheduleSubmitting) {
      return;
    }

    setRescheduleTarget(null);
    setRescheduleOptions([]);
    setSeatOptions([]);
    setSelectedFlightId(null);
    setSelectedSeatId(null);
    setRescheduleError(null);
  }

  return (
    <section className="max-w-[1600px] mx-auto px-gutter py-10">
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-8">
        <aside className="glass-panel rounded-2xl p-6 shadow-glass h-fit">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline-lg text-headline-lg">AeroClub</h2>
            <span className="material-symbols-outlined text-primary">award_star</span>
          </div>
          <div className="rounded-xl bg-surface-container p-5 border border-outline-variant/30">
            <p className="font-label-caps text-label-caps text-on-surface-variant">Status</p>
            <p className="font-headline-lg text-headline-lg text-primary mt-1">Sapphire Elite</p>
            <div className="h-3 rounded-full bg-surface-container-high mt-3">
              <div className="h-3 rounded-full bg-primary-container w-[72%]" />
            </div>
            <p className="text-right mt-2 text-mono-data">45,000 / 60,000 pts</p>
          </div>

          <div className="mt-6 space-y-4 text-body-lg text-on-surface">
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined">groups</span> Saved Travelers
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined">credit_card</span> Payment Methods
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined">settings</span> Preferences
            </p>
          </div>

          <p className="text-xs text-on-surface-variant mt-6">
            Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("en-IN") : "--"}
          </p>
        </aside>

        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="font-headline-xl text-[72px] leading-[0.95] text-on-background">My Trips</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-label-caps border ${
                  isOnline
                    ? "border-primary/40 text-primary bg-primary-container/10"
                    : "border-error/50 text-error bg-error-container/60"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-1 flex w-full md:w-auto">
                {(["upcoming", "past", "cancelled"] as BookingTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg capitalize font-label-caps text-label-caps transition-colors ${
                      activeTab === tab
                        ? "bg-surface-container-lowest text-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {usingCachedFallback ? (
            <div className="mb-4 rounded-xl border border-primary/35 bg-primary-container/15 px-4 py-3 text-sm text-primary">
              You are offline. Showing last saved bookings.
            </div>
          ) : null}

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

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((key) => (
                <LoadingSkeleton key={key} className="h-[220px] w-full" />
              ))}
            </div>
          ) : visibleBookings.length === 0 ? (
            <EmptyState
              title={usingCachedFallback ? "No saved offline bookings" : `No ${activeTab} trips`}
              description={
                usingCachedFallback
                  ? "Reconnect to sync your latest bookings, or search and book a new flight."
                  : "Book a new flight or switch tabs to review your travel history."
              }
              actionHref="/search"
              actionLabel="Search Flights"
            />
          ) : (
            <div className="space-y-4">
              {visibleBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={(bookingId) => setCancelTarget(bookingId)}
                  onReschedule={openReschedule}
                  disabled={Boolean(cancelLoadingId) || rescheduleSubmitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {cancelTarget ? (
        <div className="fixed inset-0 z-[65] bg-black/35 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="glass-panel rounded-2xl p-6 shadow-glass max-w-md w-full">
            <h3 className="font-headline-md text-headline-md">Cancel booking?</h3>
            <p className="text-on-surface-variant mt-2">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={Boolean(cancelLoadingId)}
                className="rounded-xl border border-outline px-4 py-2 hover:bg-surface-container-low transition-colors focus-ring disabled:opacity-60"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={cancelBooking}
                disabled={Boolean(cancelLoadingId)}
                className="rounded-xl bg-error text-on-error px-4 py-2 hover:opacity-90 transition-opacity focus-ring disabled:opacity-60"
              >
                {cancelLoadingId ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <RescheduleModal
        open={Boolean(rescheduleTarget)}
        currentFlightNo={rescheduleTarget?.flight.flightNo ?? ""}
        options={rescheduleOptions}
        seatOptions={seatOptions}
        selectedFlightId={selectedFlightId}
        selectedSeatId={selectedSeatId}
        feeCharged={estimatedFee}
        loadingOptions={loadingOptions}
        loadingSeats={loadingSeats}
        submitting={rescheduleSubmitting}
        error={rescheduleError}
        onClose={closeRescheduleModal}
        onSelectFlight={handleSelectFlight}
        onSelectSeat={setSelectedSeatId}
        onConfirm={confirmReschedule}
      />
    </section>
  );
}
