"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BookingStepper from "@/components/booking/BookingStepper";
import BookingSummary from "@/components/booking/BookingSummary";
import SeatMap from "@/components/seats/SeatMap";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { findFlightById } from "@/lib/mock-data";
import { buildPopularFlights } from "@/lib/popular-flights";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import { buildDemoSeatDefinitions, mapSupabaseSeatRows, type SupabaseSeatRow } from "@/lib/seats/seat-map";
import type { CabinClass, Flight } from "@/lib/types";
import { isUuid } from "@/lib/booking-data";
import { useFlightStore } from "@/store/useFlightStore";

function findFallbackFlight(flightId: string): Flight | null {
  const popular = buildPopularFlights({});
  const fromPopular = popular.find((flight) => flight.id === flightId);
  if (fromPopular) {
    return fromPopular;
  }
  return findFlightById(flightId) ?? null;
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
  const setSelectedSeat = useFlightStore((state) => state.setSelectedSeat);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);
  const passengerFormData = useFlightStore((state) => state.passengerFormData);

  const flightId = params.flightId || "";
  const cabinClass = (searchParams.get("cabinClass") ?? "economy") as CabinClass;
  const [flight, setFlight] = useState<Flight | null>(selectedFlight ?? null);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [seatError, setSeatError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    const fallback = selectedFlight?.id === flightId ? selectedFlight : findFallbackFlight(flightId);
    if (!fallback) {
      setFlight(null);
      setLoadingSeats(false);
      return;
    }
    const activeFlight = fallback;

    setFlight(activeFlight);
    setLoadingSeats(true);
    setSeatError(null);
    setBookingError(null);

    const envError = getSupabaseBrowserClientError();
    if (envError) {
      setDemoMode(true);
      setFlight({
        ...activeFlight,
        seats: activeFlight.seats.length > 0 ? activeFlight.seats : buildDemoSeatDefinitions(activeFlight.id)
      });
      setSeatError("Demo availability shown. Live reservation uses Supabase seeded flights.");
      setLoadingSeats(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setDemoMode(true);
      setFlight({
        ...activeFlight,
        seats: activeFlight.seats.length > 0 ? activeFlight.seats : buildDemoSeatDefinitions(activeFlight.id)
      });
      setSeatError("Demo availability shown. Live reservation uses Supabase seeded flights.");
      setLoadingSeats(false);
      return;
    }
    const client = supabase;

    let isMounted = true;

    async function loadSeats() {
      const { data, error } = await client
        .from("seats")
        .select("id, seat_number, class, is_available, extra_fee")
        .eq("flight_id", activeFlight.id)
        .order("seat_number", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error || !data || data.length === 0) {
        setDemoMode(true);
        setFlight({
          ...activeFlight,
          seats: activeFlight.seats.length > 0 ? activeFlight.seats : buildDemoSeatDefinitions(activeFlight.id)
        });
        setSeatError("Demo availability shown. Live reservation uses Supabase seeded flights.");
        setLoadingSeats(false);
        return;
      }

      const mappedSeats = mapSupabaseSeatRows(data as SupabaseSeatRow[]);
      const availableCount = mappedSeats.filter((seat) => seat.state === "available").length;
      setDemoMode(false);
      setFlight({
        ...activeFlight,
        seats: mappedSeats,
        availableSeatsCount: availableCount,
        available_seats_count: availableCount
      });
      setSeatError(null);
      setLoadingSeats(false);
    }

    void loadSeats();

    const channel = client
      .channel(`seat-map-${activeFlight.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seats",
          filter: `flight_id=eq.${activeFlight.id}`
        },
        () => {
          void loadSeats();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void client.removeChannel(channel);
    };
  }, [flightId, selectedFlight]);

  const safeFlight = useMemo(() => {
    if (!flight) {
      return null;
    }
    if (flight.seats.length > 0) {
      return flight;
    }
    return {
      ...flight,
      seats: buildDemoSeatDefinitions(flight.id)
    };
  }, [flight]);

  function handleSeatSelect(seat: string | null) {
    setSelectedSeat(seat);
    if (bookingError) {
      setBookingError(null);
    }
  }

  async function handleConfirm(seat: string) {
    if (!safeFlight || bookingSubmitting) {
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
      passengerFormData.passportNumber.trim().length < 6 ||
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
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          flight_id: safeFlight.id,
          seat_id: seatUuid,
          cabin_class: cabinClass,
          passenger: {
            full_name: passengerFormData.fullName.trim(),
            passport_no: passengerFormData.passportNumber.trim().toUpperCase(),
            nationality: passengerFormData.nationality.trim(),
            dob: passengerFormData.dateOfBirth
          }
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setSelectedSeat(null);
        setCurrentBookingStep("seat");
        setBookingError(payload?.message ?? "Unable to create booking right now. Please try again.");
        return;
      }

      const payload = (await response.json()) as { success: boolean; bookingId?: string; message?: string };
      if (!payload.success || typeof payload.bookingId !== "string") {
        setSelectedSeat(null);
        setCurrentBookingStep("seat");
        setBookingError(payload.message ?? "Unable to create booking right now. Please try again.");
        return;
      }

      setCurrentBookingStep("confirm");
      router.push(`/booking/confirmation/${payload.bookingId}`);
    } catch {
      setSelectedSeat(null);
      setCurrentBookingStep("seat");
      setBookingError("Unable to create booking right now. Please try again.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  if (!safeFlight) {
    return (
      <section className="max-w-[1600px] mx-auto px-gutter py-12">
        <EmptyState
          title="No flight selected"
          description="Select a flight first to continue seat selection."
          actionHref="/flights"
          actionLabel="Back to Flights"
        />
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
            <p className="font-headline-md text-headline-md">{passengerFormData.fullName || "Alex Mercer"}</p>
            <div className="border-t border-outline-variant/30 mt-4 pt-4 flex justify-between items-center">
              <span>Seat</span>
              <span className="rounded-lg bg-primary-container/20 text-primary px-3 py-1 text-mono-data">
                {selectedSeat ?? "--"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
