"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingStepper from "@/components/booking/BookingStepper";
import BookingSummary from "@/components/booking/BookingSummary";
import PassengerForm from "@/components/booking/PassengerForm";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { mapSupabaseFlightRowToFlight, type SupabaseFlightRow } from "@/lib/flights/flight-transform";
import { buildPopularFlights } from "@/lib/popular-flights";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import type { CabinClass, Traveler } from "@/lib/types";
import { useFlightStore } from "@/store/useFlightStore";

export default function PassengerPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto px-gutter py-12">Loading passenger step...</div>}>
      <PassengerPageContent />
    </Suspense>
  );
}

function normalizeCabinClass(value: string | null, fallback: CabinClass): CabinClass {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return fallback;
}

function PassengerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedFlight = useFlightStore((state) => state.selectedFlight);
  const selectedCabin = useFlightStore((state) => state.selectedCabin);
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight);
  const setPassengerFormData = useFlightStore((state) => state.setPassengerFormData);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);
  const passengerFormData = useFlightStore((state) => state.passengerFormData);

  const [flight, setFlight] = useState(selectedFlight);
  const [restoring, setRestoring] = useState(true);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [debugStatus, setDebugStatus] = useState("idle");

  const flightIdFromUrl = searchParams.get("flightId") ?? "";
  const cabinFromUrl = useMemo(
    () => normalizeCabinClass(searchParams.get("cabinClass"), selectedCabin),
    [searchParams, selectedCabin]
  );

  useEffect(() => {
    let isMounted = true;

    async function restoreFlight() {
      setRestoring(true);
      setRestoreFailed(false);
      setDebugStatus("checking_state");

      if (selectedFlight && (!flightIdFromUrl || selectedFlight.id === flightIdFromUrl)) {
        if (!isMounted) {
          return;
        }
        setCurrentBookingStep("passenger");
        setFlight(selectedFlight);
        setDebugStatus("restored_from_store");
        setRestoring(false);
        return;
      }

      if (!flightIdFromUrl) {
        if (!isMounted) {
          return;
        }
        setFlight(null);
        setRestoreFailed(true);
        setDebugStatus("missing_flight_id");
        setRestoring(false);
        return;
      }

      const envError = getSupabaseBrowserClientError();
      const supabase = envError ? null : createSupabaseBrowserClient();
      if (supabase) {
        setDebugStatus("querying_supabase");
        const { data, error } = await supabase
          .from("flights")
          .select("id, flight_no, airline, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price, created_at")
          .eq("id", flightIdFromUrl)
          .maybeSingle<SupabaseFlightRow>();

        if (!isMounted) {
          return;
        }

        if (!error && data) {
          const restored = mapSupabaseFlightRowToFlight(data);
          setSelectedFlight(restored, cabinFromUrl);
          setCurrentBookingStep("passenger");
          setFlight(restored);
          setDebugStatus("restored_from_supabase");
          setRestoring(false);
          return;
        }
      }

      const popularFlight = buildPopularFlights({}).find((item) => item.id === flightIdFromUrl) ?? null;
      if (popularFlight) {
        if (!isMounted) {
          return;
        }
        setSelectedFlight(popularFlight, cabinFromUrl);
        setCurrentBookingStep("passenger");
        setFlight(popularFlight);
        setDebugStatus("restored_from_fallback");
        setRestoring(false);
        return;
      }

      if (!isMounted) {
        return;
      }

      setFlight(null);
      setRestoreFailed(true);
      setDebugStatus("restore_failed");
      setRestoring(false);
    }

    void restoreFlight();

    return () => {
      isMounted = false;
    };
  }, [cabinFromUrl, flightIdFromUrl, selectedFlight, setCurrentBookingStep, setSelectedFlight]);

  function handleSubmit(traveler: Traveler) {
    const passportNumber = traveler.passportNumber?.trim() ?? "";
    setPassengerFormData({
      fullName: traveler.fullName,
      passportNumber,
      nationality: traveler.nationality,
      dateOfBirth: traveler.dateOfBirth,
      passport_no: traveler.passport_no?.trim() || passportNumber || null
    });
    setCurrentBookingStep("seat");
    if (!flight) {
      return;
    }
    const params = new URLSearchParams({
      cabinClass: cabinFromUrl,
      passengerName: traveler.fullName
    });
    router.push(`/booking/seat/${flight.id}?${params.toString()}`);
  }

  if (restoring) {
    return (
      <section className="max-w-[1600px] mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <h2 className="font-headline-md text-headline-md text-primary">We&apos;re restoring your selected flight...</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Please wait while we reload your flight details.</p>
          <div className="mt-4">
            <LoadingSkeleton className="h-24 w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!flight || restoreFailed) {
    return (
      <section className="max-w-[1600px] mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-8 shadow-glass">
          <h2 className="font-headline-md text-headline-md text-on-surface">We couldn&apos;t restore this flight.</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Please choose another available flight to continue your booking.
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
              <p>urlFlightId: {flightIdFromUrl || "null"}</p>
              <p>restoreStatus: {debugStatus}</p>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1600px] mx-auto px-gutter py-8 md:py-12">
      <BookingStepper activeStep={2} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mt-2">
        <div className="order-2 xl:order-1">
          <PassengerForm initialValue={passengerFormData} onSubmit={handleSubmit} />
        </div>
        <div className="order-1 xl:order-2">
          <BookingSummary flight={flight} cabinClass={selectedCabin} />
          {process.env.NODE_ENV === "development" ? (
            <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
              <p>Debug</p>
              <p>selectedFlightId: {selectedFlight?.id ?? "null"}</p>
              <p>urlFlightId: {flightIdFromUrl || "null"}</p>
              <p>restoreStatus: {debugStatus}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

