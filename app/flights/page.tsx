import FlightsPageClient from "@/components/flight/FlightsPageClient";
import {
  getTimeAwareFlights,
  normalizeFlightSearchParams,
  type NormalizedFlightSearchParams
} from "@/lib/flights/flight-service";
import type { AirportCode, CabinClass } from "@/lib/types";

type FlightsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const fallbackOrigin: AirportCode = "BLR";
const fallbackDestination: AirportCode = "DEL";

export const dynamic = "force-dynamic";

function resolveRoute(params: NormalizedFlightSearchParams): { origin: AirportCode; destination: AirportCode } {
  if (params.origin && params.destination) {
    return {
      origin: params.origin,
      destination: params.destination
    };
  }

  return { origin: fallbackOrigin, destination: fallbackDestination };
}

export default async function FlightsPage({ searchParams = {} }: FlightsPageProps) {
  const normalized = normalizeFlightSearchParams(searchParams);
  const result = await getTimeAwareFlights(searchParams);
  const route = normalized.origin && normalized.destination
    ? resolveRoute(normalized)
    : result.flights.length > 0
      ? { origin: result.flights[0].origin, destination: result.flights[0].destination }
      : resolveRoute(normalized);
  const passengers = normalized.passengers > 0 ? normalized.passengers : 1;
  const cabinClass: CabinClass = normalized.cabinClass ?? "economy";

  return (
    <FlightsPageClient
      initialFlights={result.flights}
      origin={route.origin}
      destination={route.destination}
      date={normalized.date ?? ""}
      passengers={passengers}
      cabinClass={cabinClass}
      source={result.source}
      reason={result.reason}
      dateAdjusted={result.dateAdjusted}
    />
  );
}
