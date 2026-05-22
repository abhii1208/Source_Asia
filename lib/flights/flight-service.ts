import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import { buildPopularFlights } from "@/lib/popular-flights";
import type {
  AirportCode,
  CabinClass,
  Flight,
  FlightDataSource,
  FlightFallbackReason,
  FlightStatus
} from "@/lib/types";

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
  reason?: FlightFallbackReason;
  flights: Flight[];
};

type SupabaseFlightRow = {
  id: string;
  flight_no: string;
  airline?: string | null;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number | string;
  created_at: string;
};

type SeatAvailabilityRow = {
  flight_id: string;
  is_available: boolean;
};

const knownAirports: AirportCode[] = ["BLR", "DEL", "BOM", "HYD", "MAA", "CCU", "GOI"];

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

function classPrices(basePrice: number): Record<CabinClass, number> {
  return {
    economy: Math.round(basePrice),
    business: Math.round(basePrice * 2.1),
    first: Math.round(basePrice * 3.4)
  };
}

function toStatus(status: string): FlightStatus {
  if (
    status === "scheduled" ||
    status === "boarding" ||
    status === "delayed" ||
    status === "departed" ||
    status === "landed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "scheduled";
}

function durationMinutes(departsAt: string, arrivesAt: string): number {
  const diff = new Date(arrivesAt).getTime() - new Date(departsAt).getTime();
  if (!Number.isFinite(diff) || diff <= 0) {
    return 0;
  }
  return Math.round(diff / 60000);
}

function toTags(basePrice: number, departsAt: string): string[] {
  const tags: string[] = [];
  if (basePrice <= 4000) {
    tags.push("Cheapest");
  } else if (basePrice <= 6000) {
    tags.push("Best value");
  } else {
    tags.push("Premium");
  }

  const hour = new Date(departsAt).getHours();
  if (hour < 12) {
    tags.push("Morning flight");
  } else {
    tags.push("Popular");
  }
  return tags;
}

function toTimeRange(date: string): { start: string; end: string } {
  const dayStart = new Date(`${date}T00:00:00+05:30`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: dayStart.toISOString(),
    end: dayEnd.toISOString()
  };
}

function mapRowsToFlights(rows: SupabaseFlightRow[], availabilityMap: Map<string, number>): Flight[] {
  return rows.map((row) => {
    const basePrice = Number(row.base_price);
    const computedDuration = durationMinutes(row.departs_at, row.arrives_at);
    const prices = classPrices(basePrice);
    const seatCount = availabilityMap.get(row.id);

    return {
      id: row.id,
      flightNo: row.flight_no,
      airline: row.airline ?? "FlyAhead",
      origin: normalizeAirport(row.origin) ?? "BLR",
      destination: normalizeAirport(row.destination) ?? "DEL",
      departsAt: row.departs_at,
      arrivesAt: row.arrives_at,
      aircraftType: row.aircraft_type,
      durationMinutes: computedDuration,
      status: toStatus(row.status),
      basePrice,
      classPrices: prices,
      availableCabinClasses: ["economy", "business", "first"],
      availableSeatsCount: seatCount,
      tags: toTags(basePrice, row.departs_at),
      source: "supabase",
      seats: [],
      flight_no: row.flight_no,
      airline_name: row.airline ?? "FlyAhead",
      departs_at: row.departs_at,
      arrives_at: row.arrives_at,
      aircraft_type: row.aircraft_type,
      base_price: basePrice,
      class_options: ["economy", "business", "first"],
      class_prices: prices,
      available_seats_count: seatCount,
      source_type: "supabase",
      duration: computedDuration,
      created_at: row.created_at
    };
  });
}

async function fetchSupabaseRows(params: NormalizedFlightSearchParams): Promise<SupabaseFlightRow[] | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  let query = supabase.from("flights").select("*").order("departs_at", { ascending: true });

  if (params.origin) {
    query = query.eq("origin", params.origin);
  }
  if (params.destination) {
    query = query.eq("destination", params.destination);
  }

  if (params.date) {
    const range = toTimeRange(params.date);
    query = query.gte("departs_at", range.start).lt("departs_at", range.end);
  } else {
    query = query.gte("departs_at", new Date().toISOString());
  }

  const response = await query;

  if (response.error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Supabase flights fetch failed", {
        code: response.error.code,
        message: response.error.message,
        details: response.error.details,
        hint: response.error.hint
      });
    }
    return null;
  }

  return (response.data ?? []) as SupabaseFlightRow[];
}

async function fetchAvailableSeatCounts(flightIds: string[]): Promise<Map<string, number>> {
  const availabilityMap = new Map<string, number>();
  if (flightIds.length === 0) {
    return availabilityMap;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return availabilityMap;
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
    return availabilityMap;
  }

  ((data ?? []) as SeatAvailabilityRow[]).forEach((seat) => {
    if (!seat.is_available) {
      return;
    }
    availabilityMap.set(seat.flight_id, (availabilityMap.get(seat.flight_id) ?? 0) + 1);
  });

  return availabilityMap;
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

export async function getFlightsFromSupabase(params: NormalizedFlightSearchParams): Promise<FlightServiceResult> {
  const envError = getSupabaseServerClientError();
  if (envError) {
    return {
      source: "fallback",
      reason: "missing_env",
      flights: []
    };
  }

  const rows = await fetchSupabaseRows(params);
  if (!rows) {
    return {
      source: "fallback",
      reason: "supabase_error",
      flights: []
    };
  }

  const seatCounts = await fetchAvailableSeatCounts(rows.map((row) => row.id));
  return {
    source: "supabase",
    flights: mapRowsToFlights(rows, seatCounts)
  };
}

export function getPopularFallbackFlights(
  params: NormalizedFlightSearchParams,
  reason: FlightFallbackReason = "no_results"
): FlightServiceResult {
  const flights = buildPopularFlights({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    cabinClass: params.cabinClass
  });

  return {
    source: "fallback",
    reason,
    flights
  };
}

export async function getTimeAwareFlights(params: RawFlightSearchParams): Promise<FlightServiceResult> {
  const normalized = normalizeFlightSearchParams(params);
  if (!normalized.origin || !normalized.destination) {
    return getPopularFallbackFlights(normalized, "no_results");
  }

  const live = await getFlightsFromSupabase(normalized);

  if (live.source === "supabase" && live.flights.length > 0) {
    return live;
  }

  if (live.source === "supabase" && live.flights.length === 0) {
    return getPopularFallbackFlights(normalized, "no_results");
  }

  if (live.reason === "missing_env") {
    return getPopularFallbackFlights(normalized, "missing_env");
  }

  return getPopularFallbackFlights(normalized, "supabase_error");
}
