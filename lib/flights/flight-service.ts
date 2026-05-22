import { getDayRange, getNearestUpcomingFlights, isPastDate, normalizeSearchDate } from "@/lib/flights/date-utils";
import { mapSupabaseFlightRowsToFlights, type SupabaseFlightRow } from "@/lib/flights/flight-transform";
import { buildPopularFlights } from "@/lib/popular-flights";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import type { AirportCode, CabinClass, Flight, FlightDataSource, FlightSearchReason } from "@/lib/types";

export type RawFlightSearchParams = {
  origin?: string | string[];
  destination?: string | string[];
  date?: string | string[];
  passengers?: string | string[];
  class?: string | string[];
  cabinClass?: CabinClass;
  [key: string]: string | string[] | CabinClass | undefined;
};

export type NormalizedFlightSearchParams = {
  origin?: AirportCode;
  destination?: AirportCode;
  date?: string;
  passengers: number;
  cabinClass: CabinClass;
};

export type FlightServiceResult = {
  source: FlightDataSource;
  reason: FlightSearchReason;
  flights: Flight[];
  requestedDate?: string;
  effectiveDate?: string;
  dateAdjusted?: boolean;
};

type SeatAvailabilityRow = {
  flight_id: string;
  is_available: boolean;
};

const knownAirports: AirportCode[] = ["BLR", "DEL", "BOM", "HYD", "MAA", "CCU", "GOI"];
const flightColumns =
  "id, flight_no, airline, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price, created_at";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function normalizeAirport(value: string | undefined): AirportCode | undefined {
  if (!value) {
    return undefined;
  }
  const upper = value.trim().toUpperCase();
  if (knownAirports.includes(upper as AirportCode)) {
    return upper as AirportCode;
  }
  return undefined;
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return undefined;
}

function normalizePassengers(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return Math.floor(parsed);
}

function normalizeCabinClass(value: string | undefined): CabinClass {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return "economy";
}

function fallbackResult(
  params: NormalizedFlightSearchParams,
  reason: FlightSearchReason,
  requestedDate?: string,
  effectiveDate?: string,
  dateAdjusted = false
): FlightServiceResult {
  return {
    source: "fallback",
    reason,
    flights: buildPopularFlights({
      origin: params.origin,
      destination: params.destination,
      date: effectiveDate ?? requestedDate,
      cabinClass: params.cabinClass
    }),
    requestedDate,
    effectiveDate,
    dateAdjusted
  };
}

function mapFallbackFlightsToSupabase(
  fallbackFlights: Flight[],
  supabaseRows: SupabaseFlightRow[],
  seatCounts: Map<string, number>
): Flight[] {
  if (fallbackFlights.length === 0 || supabaseRows.length === 0) {
    return fallbackFlights;
  }

  const rowByComposite = new Map<string, SupabaseFlightRow>();
  supabaseRows.forEach((row) => {
    const compositeKey = `${row.flight_no}|${row.origin}|${row.destination}|${(row.airline ?? "").toLowerCase()}`;
    rowByComposite.set(compositeKey, row);
  });

  return fallbackFlights.map((flight) => {
    const key = `${flight.flightNo}|${flight.origin}|${flight.destination}|${(flight.airline ?? "").toLowerCase()}`;
    const matched = rowByComposite.get(key);
    if (!matched) {
      return flight;
    }

    return {
      ...flight,
      id: matched.id,
      departsAt: matched.departs_at,
      arrivesAt: matched.arrives_at,
      flight_no: matched.flight_no,
      airline_name: matched.airline ?? flight.airline ?? "FlyAhead",
      departs_at: matched.departs_at,
      arrives_at: matched.arrives_at,
      aircraft_type: matched.aircraft_type,
      availableSeatsCount: seatCounts.get(matched.id),
      available_seats_count: seatCounts.get(matched.id),
      isDemoFallback: false
    };
  });
}

async function fetchSeatCounts(flightIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (flightIds.length === 0) {
    return counts;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return counts;
  }

  const { data, error } = await supabase
    .from("seats")
    .select("flight_id, is_available")
    .in("flight_id", flightIds);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Seat availability query failed", {
        code: error.code,
        message: error.message
      });
    }
    return counts;
  }

  ((data ?? []) as SeatAvailabilityRow[]).forEach((seat) => {
    if (!seat.is_available) {
      return;
    }
    counts.set(seat.flight_id, (counts.get(seat.flight_id) ?? 0) + 1);
  });

  return counts;
}

async function fetchExactRouteDateRows(
  params: NormalizedFlightSearchParams,
  date: string
): Promise<SupabaseFlightRow[] | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase || !params.origin || !params.destination) {
    return null;
  }

  const range = getDayRange(date);
  const { data, error } = await supabase
    .from("flights")
    .select(flightColumns)
    .eq("origin", params.origin)
    .eq("destination", params.destination)
    .gte("departs_at", range.start)
    .lt("departs_at", range.end)
    .order("departs_at", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Exact route/date query failed", {
        code: error.code,
        message: error.message
      });
    }
    return null;
  }

  return (data ?? []) as SupabaseFlightRow[];
}

async function fetchUpcomingRouteRows(params: NormalizedFlightSearchParams): Promise<SupabaseFlightRow[] | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase || !params.origin || !params.destination) {
    return null;
  }

  const { data, error } = await supabase
    .from("flights")
    .select(flightColumns)
    .eq("origin", params.origin)
    .eq("destination", params.destination)
    .gte("departs_at", new Date().toISOString())
    .order("departs_at", { ascending: true })
    .limit(18);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Nearest route query failed", {
        code: error.code,
        message: error.message
      });
    }
    return null;
  }

  return getNearestUpcomingFlights((data ?? []) as SupabaseFlightRow[]);
}

async function fetchPopularUpcomingRows(limit = 12): Promise<SupabaseFlightRow[] | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("flights")
    .select(flightColumns)
    .gte("departs_at", new Date().toISOString())
    .order("departs_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Popular flights query failed", {
        code: error.code,
        message: error.message
      });
    }
    return null;
  }

  return getNearestUpcomingFlights((data ?? []) as SupabaseFlightRow[]);
}

export function normalizeFlightSearchParams(params: RawFlightSearchParams): NormalizedFlightSearchParams {
  const origin = normalizeAirport(firstParam(params.origin));
  const destination = normalizeAirport(firstParam(params.destination));
  const date = normalizeDate(firstParam(params.date));
  const passengers = normalizePassengers(firstParam(params.passengers));
  const explicitCabin = typeof params.cabinClass === "string" ? params.cabinClass : undefined;
  const cabinClass = normalizeCabinClass(firstParam(params.class) ?? explicitCabin);

  if (origin && destination && origin === destination) {
    return {
      origin,
      destination: undefined,
      date,
      passengers,
      cabinClass
    };
  }

  return {
    origin,
    destination,
    date,
    passengers,
    cabinClass
  };
}

export async function getTimeAwareFlights(params: RawFlightSearchParams): Promise<FlightServiceResult> {
  const normalized = normalizeFlightSearchParams(params);
  const requestedDate = normalized.date;
  const dateAdjusted = requestedDate ? isPastDate(requestedDate) : false;
  const effectiveDate = requestedDate ? (dateAdjusted ? normalizeSearchDate() : requestedDate) : normalizeSearchDate();

  if (!normalized.origin || !normalized.destination) {
    return fallbackResult(normalized, "popular_route", requestedDate, effectiveDate, dateAdjusted);
  }

  const envError = getSupabaseServerClientError();
  if (envError) {
    return fallbackResult(normalized, "supabase_error", requestedDate, effectiveDate, dateAdjusted);
  }

  const exactRows = requestedDate && !dateAdjusted
    ? await fetchExactRouteDateRows(normalized, requestedDate)
    : [];

  if (requestedDate && !dateAdjusted && exactRows === null) {
    return fallbackResult(normalized, "supabase_error", requestedDate, effectiveDate, false);
  }

  if (exactRows && exactRows.length > 0) {
    const seatCounts = await fetchSeatCounts(exactRows.map((row) => row.id));
    return {
      source: "supabase",
      reason: "exact_match",
      flights: mapSupabaseFlightRowsToFlights(exactRows, seatCounts),
      requestedDate,
      effectiveDate: requestedDate
    };
  }

  const nearestRows = await fetchUpcomingRouteRows(normalized);
  if (nearestRows === null) {
    return fallbackResult(normalized, "supabase_error", requestedDate, effectiveDate, dateAdjusted);
  }

  if (nearestRows.length > 0) {
    const seatCounts = await fetchSeatCounts(nearestRows.map((row) => row.id));
    return {
      source: "supabase",
      reason: "nearest_date",
      flights: mapSupabaseFlightRowsToFlights(nearestRows, seatCounts),
      requestedDate,
      effectiveDate,
      dateAdjusted
    };
  }

  const popularRows = await fetchPopularUpcomingRows();
  if (popularRows === null) {
    return fallbackResult(normalized, "supabase_error", requestedDate, effectiveDate, dateAdjusted);
  }

  if (popularRows.length > 0) {
    const seatCounts = await fetchSeatCounts(popularRows.map((row) => row.id));
    return {
      source: "supabase",
      reason: "popular_route",
      flights: mapSupabaseFlightRowsToFlights(popularRows, seatCounts),
      requestedDate,
      effectiveDate,
      dateAdjusted
    };
  }

  const fallback = fallbackResult(normalized, "popular_route", requestedDate, effectiveDate, dateAdjusted);
  const rowsForMatching = await fetchPopularUpcomingRows(150);
  if (!rowsForMatching) {
    return fallback;
  }
  const fallbackSeatCounts = await fetchSeatCounts(rowsForMatching.map((row) => row.id));
  return {
    ...fallback,
    flights: mapFallbackFlightsToSupabase(fallback.flights, rowsForMatching, fallbackSeatCounts)
  };
}

