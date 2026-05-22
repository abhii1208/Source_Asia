"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DestinationImage from "@/components/flight/DestinationImage";
import FlightFilters, { type FlightFilterState } from "@/components/flight/FlightFilters";
import FlightResultsList from "@/components/flight/FlightResultsList";
import { getDestinationImage } from "@/lib/destination-images";
import type { AirportCode, CabinClass, Flight, FlightDataSource, FlightSearchReason } from "@/lib/types";
import { useFlightStore } from "@/store/useFlightStore";

type FlightsPageClientProps = {
  initialFlights: Flight[];
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  cabinClass: CabinClass;
  source: FlightDataSource;
  reason: FlightSearchReason;
  dateAdjusted?: boolean;
};

const initialFilters: FlightFilterState = {
  maxPrice: 30000,
  time: "all",
  cabinClass: "all",
  status: ["scheduled", "boarding", "delayed", "departed", "landed", "cancelled"]
};

const knownAirports: AirportCode[] = ["BLR", "DEL", "BOM", "HYD", "MAA", "CCU", "GOI"];

function toAirportCode(value: string, fallback: AirportCode): AirportCode {
  const upper = value.trim().toUpperCase();
  if (knownAirports.includes(upper as AirportCode)) {
    return upper as AirportCode;
  }
  return fallback;
}

function departureHour(iso: string): number {
  return new Date(iso).getHours();
}

function resultsMessage(reason: FlightSearchReason, dateAdjusted?: boolean): string {
  if (reason === "nearest_date" && dateAdjusted) {
    return "Selected date is in the past, showing upcoming flights instead.";
  }
  if (reason === "nearest_date") {
    return "No flights were found for your selected date, so we are showing the nearest available flights.";
  }
  if (reason === "popular_route") {
    return "No exact route matches found. Showing popular available flights.";
  }
  if (reason === "supabase_error") {
    return "Live flight data is temporarily unavailable. Showing popular flights for now.";
  }
  return "";
}

export default function FlightsPageClient({
  initialFlights,
  origin,
  destination,
  date,
  passengers,
  cabinClass,
  source,
  reason,
  dateAdjusted = false
}: FlightsPageClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FlightFilterState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery);
  const showResultBanner = reason !== "exact_match";
  const originMeta = getDestinationImage(toAirportCode(origin, "BLR"));
  const destinationMeta = getDestinationImage(toAirportCode(destination, "DEL"));

  useEffect(() => {
    setSearchQuery({
      origin: toAirportCode(origin, "BLR"),
      destination: toAirportCode(destination, "DEL"),
      date,
      passengerCount: passengers,
      cabinClass
    });
  }, [cabinClass, date, destination, origin, passengers, setSearchQuery]);

  const filteredFlights = useMemo(() => {
    let rows: Flight[] = [...initialFlights];

    rows = rows.filter((flight) => {
      const hour = departureHour(flight.departsAt);
      if (filters.time === "morning") {
        return hour >= 6 && hour < 12;
      }
      if (filters.time === "afternoon") {
        return hour >= 12 && hour < 18;
      }
      if (filters.time === "evening") {
        return hour >= 18 && hour <= 23;
      }
      return true;
    });

    rows = rows.filter((flight) => filters.status.includes(flight.status));

    rows = rows.filter((flight) => {
      if (filters.cabinClass === "all") {
        return flight.basePrice <= filters.maxPrice;
      }
      return flight.classPrices[filters.cabinClass] <= filters.maxPrice;
    });

    rows = [...rows].sort((a, b) => {
      const priceA = filters.cabinClass === "all" ? a.classPrices[cabinClass] : a.classPrices[filters.cabinClass];
      const priceB = filters.cabinClass === "all" ? b.classPrices[cabinClass] : b.classPrices[filters.cabinClass];
      return sortAsc ? priceA - priceB : priceB - priceA;
    });

    return rows;
  }, [initialFlights, filters, sortAsc, cabinClass]);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, [filters, origin, destination, sortAsc, initialFlights]);

  function handleSelect(flight: Flight, selectedClass: CabinClass) {
    setSelectedFlight(flight, selectedClass);
    setCurrentBookingStep("passenger");
    router.push(`/booking/passenger?flightId=${encodeURIComponent(flight.id)}&cabinClass=${selectedClass}`);
  }

  function retryLiveSearch() {
    router.refresh();
  }

  return (
    <section className="max-w-[1600px] mx-auto px-gutter py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <FlightFilters value={filters} onChange={setFilters} onClear={() => setFilters(initialFilters)} />

        <div>
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/35 bg-white/60 shadow-soft">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
              <div className="p-5 md:p-6">
                <h1 className="font-headline-xl text-[44px] leading-tight text-on-background">
                  {origin} to {destination}
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                  {originMeta.cityName} to {destinationMeta.cityName} | {date || "Upcoming"} | {passengers} Passenger
                  {passengers > 1 ? "s" : ""} | {cabinClass}
                </p>
                <p className="text-sm text-on-surface-variant mt-3">
                  {destinationMeta.description}
                </p>
              </div>
              <DestinationImage
                airportCode={toAirportCode(destination, "DEL")}
                className="h-[190px] md:h-full rounded-none"
                sizes="(max-width: 768px) 100vw, 280px"
                showLabel
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg leading-tight text-on-background">
                {origin} to {destination}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                {date || "Upcoming"} | {passengers} Passenger{passengers > 1 ? "s" : ""} | {cabinClass}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSortAsc((current) => !current)}
              className="rounded-xl border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
            >
              Sort by Price ({sortAsc ? "Low to High" : "High to Low"})
            </button>
          </div>

          {showResultBanner ? (
            <div className="mb-5 rounded-2xl border border-primary/30 bg-primary-container/10 p-4 md:p-5">
              <h2 className="font-headline-md text-headline-md text-primary">
                {reason === "nearest_date"
                  ? "Showing nearest available flights"
                  : reason === "popular_route"
                    ? "Showing popular available flights"
                    : "Showing fallback flight options"}
              </h2>
              <p className="mt-2 text-sm text-on-surface">{resultsMessage(reason, dateAdjusted)}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={retryLiveSearch}
                  className="rounded-xl bg-primary text-on-primary px-4 py-2 hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
                >
                  Retry live search
                </button>
                <Link
                  href="/search"
                  className="rounded-xl border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
                >
                  View popular routes
                </Link>
              </div>
              {process.env.NODE_ENV !== "production" ? (
                <p className="mt-3 text-xs text-on-surface-variant">
                  Dev hint: reason={reason}, source={source}, route={origin}-{destination}, date={date || "upcoming"}.
                </p>
              ) : null}
            </div>
          ) : null}

          <FlightResultsList loading={loading} flights={filteredFlights} onSelect={handleSelect} />
        </div>
      </div>
    </section>
  );
}
