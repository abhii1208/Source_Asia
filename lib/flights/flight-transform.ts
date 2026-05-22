import type { AirportCode, CabinClass, Flight, FlightStatus } from "@/lib/types";

export type SupabaseFlightRow = {
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

const knownAirports: AirportCode[] = ["BLR", "DEL", "BOM", "HYD", "MAA", "CCU", "GOI"];

function normalizeAirport(value: string, fallback: AirportCode): AirportCode {
  const upper = value.trim().toUpperCase();
  if (knownAirports.includes(upper as AirportCode)) {
    return upper as AirportCode;
  }
  return fallback;
}

function toFlightStatus(status: string): FlightStatus {
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

function classPrices(basePrice: number): Record<CabinClass, number> {
  return {
    economy: Math.round(basePrice),
    business: Math.round(basePrice * 2.1),
    first: Math.round(basePrice * 3.4)
  };
}

function tags(basePrice: number, departsAt: string): string[] {
  const labels: string[] = [];
  if (basePrice <= 4000) {
    labels.push("Cheapest");
  } else if (basePrice <= 6000) {
    labels.push("Best value");
  } else {
    labels.push("Premium");
  }

  const hour = new Date(departsAt).getHours();
  if (hour < 12) {
    labels.push("Morning flight");
  } else {
    labels.push("Popular");
  }

  return labels;
}

export function mapSupabaseFlightRowToFlight(row: SupabaseFlightRow, seatCount?: number): Flight {
  const basePrice = Number(row.base_price);
  const computedDuration = durationMinutes(row.departs_at, row.arrives_at);
  const prices = classPrices(basePrice);

  return {
    id: row.id,
    flightNo: row.flight_no,
    airline: row.airline ?? "FlyAhead",
    origin: normalizeAirport(row.origin, "BLR"),
    destination: normalizeAirport(row.destination, "DEL"),
    departsAt: row.departs_at,
    arrivesAt: row.arrives_at,
    aircraftType: row.aircraft_type,
    durationMinutes: computedDuration,
    status: toFlightStatus(row.status),
    basePrice,
    classPrices: prices,
    availableCabinClasses: ["economy", "business", "first"],
    availableSeatsCount: seatCount,
    tags: tags(basePrice, row.departs_at),
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
}

export function mapSupabaseFlightRowsToFlights(
  rows: SupabaseFlightRow[],
  seatCounts?: Map<string, number>
): Flight[] {
  return rows.map((row) => mapSupabaseFlightRowToFlight(row, seatCounts?.get(row.id)));
}

