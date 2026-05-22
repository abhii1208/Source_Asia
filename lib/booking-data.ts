import type {
  AirportCode,
  BookingStatus,
  BookingWithDetails,
  CabinClass,
  FlightStatus,
  RescheduleOption,
  RescheduleRecord,
  SeatSummary
} from "@/lib/types";

type FlightJoinRow = {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number | string;
};

type SeatJoinRow = {
  id: string;
  seat_number: string;
  class: string;
  extra_fee: number | string | null;
  is_available: boolean;
};

type PassengerJoinRow = {
  id: string;
  full_name: string;
  nationality: string;
  dob: string;
}[] | null;

type BookingRow = {
  id: string;
  status: string;
  booked_at: string;
  total_price: number | string;
  pnr_code: string;
  flights: FlightJoinRow | FlightJoinRow[] | null;
  seats: SeatJoinRow | SeatJoinRow[] | null;
  passengers: PassengerJoinRow;
};

type RescheduleRow = {
  id: string;
  booking_id: string;
  old_flight_id: string;
  new_flight_id: string;
  requested_at: string;
  fee_charged: number | string;
};

type FlightNoRow = {
  id: string;
  flight_no: string;
};

type AlternativeFlightRow = {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number | string;
};

export type AlternativeSeatRow = {
  id: string;
  seat_number: string;
  class: string;
  extra_fee: number | string | null;
  is_available: boolean;
};

const knownAirports: AirportCode[] = ["BLR", "DEL", "BOM", "HYD", "MAA", "CCU", "GOI"];

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function toAirportCode(value: string, fallback: AirportCode = "BLR"): AirportCode {
  const upper = value.trim().toUpperCase();
  if (knownAirports.includes(upper as AirportCode)) {
    return upper as AirportCode;
  }
  return fallback;
}

export function toFlightStatus(value: string): FlightStatus {
  if (
    value === "scheduled" ||
    value === "boarding" ||
    value === "delayed" ||
    value === "departed" ||
    value === "landed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "scheduled";
}

export function toBookingStatus(value: string): BookingStatus {
  if (value === "confirmed" || value === "rescheduled" || value === "cancelled") {
    return value;
  }
  return "confirmed";
}

export function toCabinClass(value: string): CabinClass {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return "economy";
}

export function computeDurationMinutes(departsAt: string, arrivesAt: string): number {
  const diffMs = new Date(arrivesAt).getTime() - new Date(departsAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }
  return Math.round(diffMs / 60000);
}

export function mapSeatRow(seat: AlternativeSeatRow): SeatSummary {
  return {
    id: seat.id,
    seatNumber: seat.seat_number,
    seatClass: toCabinClass(seat.class),
    extraFee: Number(seat.extra_fee ?? 0),
    isAvailable: seat.is_available
  };
}

export function mapBookingRow(row: BookingRow, reschedules: RescheduleRecord[] = []): BookingWithDetails | null {
  const flight = Array.isArray(row.flights) ? (row.flights[0] ?? null) : row.flights;
  const seat = Array.isArray(row.seats) ? (row.seats[0] ?? null) : row.seats;

  if (!flight || !seat) {
    return null;
  }

  const departsAt = flight.departs_at;
  const arrivesAt = flight.arrives_at;

  return {
    id: row.id,
    pnrCode: row.pnr_code,
    status: toBookingStatus(row.status),
    bookedAt: row.booked_at,
    totalPrice: Number(row.total_price),
    flight: {
      id: flight.id,
      flightNo: flight.flight_no,
      origin: toAirportCode(flight.origin),
      destination: toAirportCode(flight.destination, "DEL"),
      departsAt,
      arrivesAt,
      aircraftType: flight.aircraft_type,
      status: toFlightStatus(flight.status),
      basePrice: Number(flight.base_price),
      durationMinutes: computeDurationMinutes(departsAt, arrivesAt)
    },
    seat: {
      id: seat.id,
      seatNumber: seat.seat_number,
      seatClass: toCabinClass(seat.class),
      extraFee: Number(seat.extra_fee ?? 0),
      isAvailable: seat.is_available
    },
    passengers: (row.passengers ?? []).map((passenger) => ({
      id: passenger.id,
      fullName: passenger.full_name,
      nationality: passenger.nationality,
      dateOfBirth: passenger.dob
    })),
    reschedules
  };
}

export function mapRescheduleRows(rows: RescheduleRow[], flights: FlightNoRow[]): RescheduleRecord[] {
  const flightMap = new Map<string, string>();
  flights.forEach((flight) => {
    flightMap.set(flight.id, flight.flight_no);
  });

  return rows.map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    oldFlightId: row.old_flight_id,
    newFlightId: row.new_flight_id,
    oldFlightNo: flightMap.get(row.old_flight_id) ?? "Unknown",
    newFlightNo: flightMap.get(row.new_flight_id) ?? "Unknown",
    requestedAt: row.requested_at,
    feeCharged: Number(row.fee_charged)
  }));
}

export function mapAlternativeFlightRow(row: AlternativeFlightRow, currentTotalPrice: number): RescheduleOption {
  const basePrice = Number(row.base_price);

  return {
    flightId: row.id,
    flightNo: row.flight_no,
    origin: toAirportCode(row.origin),
    destination: toAirportCode(row.destination, "DEL"),
    departsAt: row.departs_at,
    arrivesAt: row.arrives_at,
    aircraftType: row.aircraft_type,
    status: toFlightStatus(row.status),
    basePrice,
    priceDifference: Math.max(0, basePrice - currentTotalPrice)
  };
}

export type { BookingRow, RescheduleRow, FlightNoRow, AlternativeFlightRow };
