"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingStepper from "@/components/booking/BookingStepper";
import BookingSummary from "@/components/booking/BookingSummary";
import PassengerForm from "@/components/booking/PassengerForm";
import EmptyState from "@/components/ui/EmptyState";
import { buildPopularFlights } from "@/lib/popular-flights";
import type { Traveler } from "@/lib/types";
import { isUuid } from "@/lib/booking-data";
import { useFlightStore } from "@/store/useFlightStore";

export default function PassengerPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto px-gutter py-12">Loading passenger step...</div>}>
      <PassengerPageContent />
    </Suspense>
  );
}

function PassengerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedFlight = useFlightStore((state) => state.selectedFlight);
  const selectedCabin = useFlightStore((state) => state.selectedCabin);
  const setPassengerFormData = useFlightStore((state) => state.setPassengerFormData);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);
  const passengerFormData = useFlightStore((state) => state.passengerFormData);

  const flight = useMemo(() => {
    if (selectedFlight && isUuid(selectedFlight.id)) {
      return selectedFlight;
    }
    const fallbackFlightId = searchParams.get("flightId") ?? "";
    const popularFlight = buildPopularFlights({}).find((item) => item.id === fallbackFlightId);
    return popularFlight ?? null;
  }, [searchParams, selectedFlight]);

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
      cabinClass: selectedCabin,
      passengerName: traveler.fullName
    });
    router.push(`/booking/seat/${flight.id}?${params.toString()}`);
  }

  if (!flight) {
    return (
      <section className="max-w-[1600px] mx-auto px-gutter py-12">
        <EmptyState
          title="Please select a valid flight"
          description="Your saved flight selection is outdated. Choose a flight again to continue booking."
          actionHref="/flights"
          actionLabel="Back to Flights"
        />
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
        </div>
      </div>
    </section>
  );
}

