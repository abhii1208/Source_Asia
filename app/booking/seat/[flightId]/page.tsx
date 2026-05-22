"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BookingStepper from "@/components/booking/BookingStepper";
import BookingSummary from "@/components/booking/BookingSummary";
import SeatMap from "@/components/seats/SeatMap";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { mapSupabaseFlightRowToFlight, type SupabaseFlightRow } from "@/lib/flights/flight-transform";
import { buildPopularFlights } from "@/lib/popular-flights";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import { buildDemoSeatDefinitions, mapSupabaseSeatRows, type SupabaseSeatRow } from "@/lib/seats/seat-map";
import type { CabinClass, Flight } from "@/lib/types";
import { isUuid } from "@/lib/booking-data";
import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";

function findFallbackFlight(flightId: string): Flight | null {
  const popular = buildPopularFlights({});
  return popular.find((flight) => flight.id === flightId) ?? null;
}

function normalizeCabinClass(value: string | null, fallback: CabinClass): CabinClass {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return fallback;
}

export default function SeatSelectionPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto px-gutter py-12">Loading seats...</div>}>
      <SeatSelectionPageContent />
    </Suspense>
  );
}

function SeatSelectionPageContent() {
  const params = useParams<{ flightId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedFlight = useFlightStore((state) => state.selectedFlight);
  const selectedSeat = useFlightStore((state) => state.selectedSeat);
  const selectedCabin = useFlightStore((state) => state.selectedCabin);
  const setSelectedSeat = useFlightStore((state) => state.setSelectedSeat);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight);
  const passengerFormData = useFlightStore((state) => state.passengerFormData);
  const searchQuery = useFlightStore((state) => state.searchQuery);
  const clearSensitivePassengerData = useFlightStore((state) => state.clearSensitivePassengerData);
  const setTicketEmailStatus = useUserStore((state) => state.setTicketEmailStatus);

  const flightId = params.flightId || "";
  const cabinClass = normalizeCabinClass(searchParams.get("cabinClass"), selectedCabin);

  const [flight, setFlight] = useState<Flight | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [seatError, setSeatError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState("idle");

  useEffect(() => {
    let isMounted = true;
    const envError = getSupabaseBrowserClientError();
    const supabase = envError ? null : createSupabaseBrowserClient();

    async function resolveFlight(): Promise<Flight | null> {
      if (!flightId) {
        setRestoreStatus("missing_flight_id");
        return null;
      }

      if (selectedFlight?.id === flightId) {
        setRestoreStatus("restored_from_store");
        return selectedFlight;
      }

      if (supabase) {
        setRestoreStatus("querying_supabase");
        const { data, error } = await supabase
          .from("flights")
          .select("id, flight_no, airline, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price, created_at")
          .eq("id", flightId)
          .maybeSingle<SupabaseFlightRow>();

        if (!error && data) {
          setRestoreStatus("restored_from_supabase");
          return mapSupabaseFlightRowToFlight(data);
        }
      }

      const fallback = findFallbackFlight(flightId);
      if (fallback) {
        setRestoreStatus("restored_from_fallback");
        return fallback;
      }

      setRestoreStatus("restore_failed");
      return null;
    }

    async function loadSeatsForFlight(activeFlight: Flight) {
      if (!supabase) {
        setDemoMode(true);
        setSeatError("Live seat data is unavailable right now. Showing demo seat layout.");
        setFlight({
          ...activeFlight,
          seats: activeFlight.seats.length > 0 ? activeFlight.seats : buildDemoSeatDefinitions(activeFlight.id)
        });
        setLoadingSeats(false);
        return;
      }

      const { data, error } = await supabase
        .from("seats")
        .select("id, flight_id, seat_number, class, is_available, extra_fee")
        .eq("flight_id", flightId)
        .order("seat_number", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        setDemoMode(true);
        setSeatError("Unable to load live seats right now. Showing demo seat layout.");
        setFlight({
          ...activeFlight,
          seats: activeFlight.seats.length > 0 ? activeFlight.seats : buildDemoSeatDefinitions(activeFlight.id)
        });
        setLoadingSeats(false);
        return;
      }

      if (!data || data.length === 0) {
        setDemoMode(false);
        setFlight({
          ...activeFlight,
          seats: []
        });
        setSeatError("Seats are not configured for this flight.");
        setLoadingSeats(false);
        return;
      }

      const mappedSeats = mapSupabaseSeatRows(data as SupabaseSeatRow[]);
      const availableCount = mappedSeats.filter((seat) => seat.state === "available").length;
      const latestSelectedSeat = useFlightStore.getState().selectedSeat;
      if (latestSelectedSeat) {
        const selectedSeatStillAvailable = mappedSeats.some(
          (seat) => seat.id === latestSelectedSeat && seat.state === "available"
        );

        if (!selectedSeatStillAvailable) {
          setSelectedSeat(null);
          setBookingError("Your selected seat just became unavailable. Please choose another seat.");
        }
      }

      setDemoMode(false);
      setSeatError(null);
      setFlight({
        ...activeFlight,
        seats: mappedSeats,
        availableSeatsCount: availableCount,
        available_seats_count: availableCount
      });
      setLoadingSeats(false);
    }

    async function restoreAndLoad() {
      setLoadingSeats(true);
      setRestoreFailed(false);
      setSeatError(null);
      setBookingError(null);

      const activeFlight = await resolveFlight();
      if (!isMounted) {
        return;
      }

      if (!activeFlight) {
        setFlight(null);
        setRestoreFailed(true);
        setLoadingSeats(false);
        return;
      }

      if (!selectedFlight || selectedFlight.id !== activeFlight.id) {
        setSelectedFlight(activeFlight, cabinClass);
      }

      setCurrentBookingStep("seat");
      await loadSeatsForFlight(activeFlight);
    }

    void restoreAndLoad();

    if (!supabase || !flightId) {
      return () => {
        isMounted = false;
      };
    }

    const channel = supabase
      .channel(`seat-map-${flightId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seats",
          filter: `flight_id=eq.${flightId}`
        },
        () => {
          const currentFlight = useFlightStore.getState().selectedFlight;
          if (currentFlight && currentFlight.id === flightId) {
            void (async () => {
              await restoreAndLoad();
            })();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [cabinClass, flightId, selectedFlight, setCurrentBookingStep, setSelectedFlight, setSelectedSeat]);

  const safeFlight = useMemo(() => {
    if (!flight) {
      return null;
    }
    if (flight.seats.length > 0) {
      return flight;
    }
    if (demoMode) {
      return {
        ...flight,
        seats: buildDemoSeatDefinitions(flight.id)
      };
    }
    return flight;
  }, [demoMode, flight]);

  const seatsNotConfigured = Boolean(safeFlight && safeFlight.seats.length === 0 && !demoMode);

  function handleSeatSelect(seat: string | null) {
    setSelectedSeat(seat);
    if (bookingError) {
      setBookingError(null);
    }
  }

  async function handleConfirm(seat: string) {
    if (!safeFlight || bookingSubmitting || seatsNotConfigured) {
      return;
    }

    if (!selectedFlight || selectedFlight.id !== safeFlight.id) {
      setSelectedFlight(safeFlight, cabinClass);
    }

    if (!selectedSeat && !seat) {
      setBookingError("Please choose your seat before confirming the ticket.");
      return;
    }

    const selectedSeatDefinition = safeFlight.seats.find((item) => item.id === seat) ?? null;
    const seatUuid = selectedSeatDefinition?.seatUuid ?? (isUuid(seat) ? seat : null);

    if (!seatUuid) {
      setSelectedSeat(null);
      setCurrentBookingStep("seat");
      setBookingError("Live seat mapping is unavailable for this selection. Please choose another seat and retry.");
      return;
    }

    if (
      passengerFormData.fullName.trim().length < 3 ||
      passengerFormData.nationality.trim().length < 2 ||
      !passengerFormData.dateOfBirth
    ) {
      setCurrentBookingStep("passenger");
      router.push(`/booking/passenger?flightId=${safeFlight.id}`);
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const passengerCount = Math.max(1, searchQuery.passengerCount);
      const totalPrice = Math.round((safeFlight.basePrice + Number(selectedSeatDefinition?.priceDelta ?? 0)) * passengerCount);

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          flight_id: flightId,
          seat_id: seatUuid,
          total_price: totalPrice,
          passengers: [
            {
              full_name: passengerFormData.fullName.trim(),
              passport_no: passengerFormData.passportNumber.trim().toUpperCase() || null,
              nationality: passengerFormData.nationality.trim(),
              dob: passengerFormData.dateOfBirth
            }
          ]
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        const seatConflict =
          response.status === 409 ||
          payload?.message?.toLowerCase().includes("seat was just booked") ||
          payload?.message?.toLowerCase().includes("select another seat");

        if (seatConflict) {
          setSelectedSeat(null);
          setCurrentBookingStep("seat");
          setBookingError("This seat was just booked. Please select another seat.");
          return;
        }

        setBookingError(payload?.message ?? "Unable to confirm ticket right now. Please try again.");
        return;
      }

      const payload = (await response.json()) as {
        success: boolean;
        bookingId?: string;
        emailSent?: boolean;
        emailStatus?: "sent" | "not_configured" | "failed";
        emailReason?: "missing_config" | "missing_user_email" | "send_failed";
        message?: string;
      };
      if (!payload.success || typeof payload.bookingId !== "string") {
        setSelectedSeat(null);
        setCurrentBookingStep("seat");
        setBookingError(payload.message ?? "Unable to confirm ticket right now. Please try again.");
        return;
      }

      clearSensitivePassengerData();
      if (payload.emailStatus) {
        setTicketEmailStatus(payload.bookingId, payload.emailStatus);
      }
      setCurrentBookingStep("confirm");
      const confirmationQuery = new URLSearchParams();
      if (typeof payload.emailSent === "boolean") {
        confirmationQuery.set("emailSent", payload.emailSent ? "true" : "false");
      }
      if (payload.emailStatus) {
        confirmationQuery.set("emailStatus", payload.emailStatus);
      }
      if (payload.emailReason) {
        confirmationQuery.set("emailReason", payload.emailReason);
      }
      const confirmationPath = confirmationQuery.toString()
        ? `/booking/confirmation/${payload.bookingId}?${confirmationQuery.toString()}`
        : `/booking/confirmation/${payload.bookingId}`;
      router.push(confirmationPath);
    } catch {
      setSelectedSeat(null);
      setCurrentBookingStep("seat");
      setBookingError("Unable to confirm ticket right now. Please try again.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  if (restoreFailed || !safeFlight) {
    return (
      <section className="max-w-[1600px] mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-8 shadow-glass">
          <h2 className="font-headline-md text-headline-md text-on-surface">We couldn&apos;t restore this flight.</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Please choose another available flight to continue.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="rounded-xl bg-primary px-5 py-3 text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
            >
              Search Flights
            </Link>
            <Link
              href="/flights?origin=BLR&destination=DEL&passengers=1&class=economy"
              className="rounded-xl border border-primary px-5 py-3 text-primary hover:bg-primary hover:text-on-primary transition-colors focus-ring"
            >
              View Popular Flights
            </Link>
          </div>
          {process.env.NODE_ENV === "development" ? (
            <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
              <p>Debug</p>
              <p>selectedFlightId: {selectedFlight?.id ?? "null"}</p>
              <p>urlFlightId: {flightId || "null"}</p>
              <p>restoreStatus: {restoreStatus}</p>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1600px] mx-auto px-gutter py-8 md:py-12">
      <BookingStepper activeStep={3} />

      {seatError ? (
        <div className="mb-4 rounded-xl border border-primary/35 bg-primary-container/15 px-4 py-3 text-sm text-primary">
          {seatError}
        </div>
      ) : null}
      {bookingError ? (
        <div className="mb-4 rounded-xl border border-error/40 bg-error-container px-4 py-3 text-sm text-on-error-container">
          {bookingError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 mt-3">
        {loadingSeats ? (
          <div className="space-y-4">
            <LoadingSkeleton className="h-[480px] w-full" />
            <LoadingSkeleton className="h-[120px] w-full" />
          </div>
        ) : seatsNotConfigured ? (
          <div className="glass-panel rounded-2xl p-8 shadow-glass">
            <h3 className="font-headline-md text-headline-md text-on-surface">Seats are not configured for this flight.</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Please choose another flight while seat inventory is being updated.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/flights"
                className="rounded-xl bg-primary px-5 py-3 text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
              >
                Back to Flight Results
              </Link>
              <Link
                href="/search"
                className="rounded-xl border border-primary px-5 py-3 text-primary hover:bg-primary hover:text-on-primary transition-colors focus-ring"
              >
                Search Again
              </Link>
            </div>
          </div>
        ) : (
          <SeatMap
            flight={safeFlight}
            selectedCabin={cabinClass}
            initialSeat={selectedSeat}
            onSeatSelect={handleSeatSelect}
            onConfirm={handleConfirm}
            confirming={bookingSubmitting}
            showDemoLabel={demoMode}
          />
        )}

        <div className="xl:sticky xl:top-[96px] h-fit">
          <BookingSummary flight={safeFlight} cabinClass={cabinClass} seat={selectedSeat} />
          <div className="glass-panel rounded-2xl p-6 shadow-glass mt-5">
            <h3 className="font-headline-md text-headline-md mb-2">Seat Details</h3>
            <p className="text-on-surface-variant">Passenger 1</p>
            <p className="font-headline-md text-headline-md">{passengerFormData.fullName || "Passenger"}</p>
            <div className="border-t border-outline-variant/30 mt-4 pt-4 flex justify-between items-center">
              <span>Seat</span>
              <span className="rounded-lg bg-primary-container/20 text-primary px-3 py-1 text-mono-data">
                {selectedSeat ?? "--"}
              </span>
            </div>
          </div>

          {process.env.NODE_ENV === "development" ? (
            <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
              <p>Debug</p>
              <p>selectedFlightId: {selectedFlight?.id ?? "null"}</p>
              <p>urlFlightId: {flightId || "null"}</p>
              <p>restoreStatus: {restoreStatus}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
