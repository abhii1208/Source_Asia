import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/booking-data";

type BookingStatus = "confirmed" | "rescheduled" | "cancelled";
type SeatClass = "economy" | "business" | "first";

type BookingRow = {
  id: string;
  status: string;
  booked_at: string;
  total_price: number | string;
  pnr_code: string;
  flights: FlightRow | FlightRow[] | null;
  seats: SeatRow | SeatRow[] | null;
  passengers: PassengerRow[] | null;
};

type FlightRow = {
  id: string;
  flight_no: string;
  airline: string | null;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number | string;
};

type SeatRow = {
  id: string;
  seat_number: string;
  class: string;
  extra_fee: number | string | null;
  is_available: boolean;
};

type PassengerRow = {
  id: string;
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
};

export type BookingDetails = {
  booking: {
    id: string;
    status: BookingStatus;
    bookedAt: string;
    totalPrice: number;
    pnrCode: string;
  };
  flight: {
    id: string;
    flightNo: string;
    airline: string;
    origin: string;
    destination: string;
    departsAt: string;
    arrivesAt: string;
    aircraftType: string;
    status: string;
    basePrice: number;
  };
  seat: {
    id: string;
    seatNumber: string;
    seatClass: SeatClass;
    extraFee: number;
    isAvailable: boolean;
  };
  passengers: Array<{
    id: string;
    fullName: string;
    passportNo: string;
    nationality: string;
    dateOfBirth: string;
  }>;
  userEmail: string | null;
};

type GetBookingDetailsInput = {
  supabase: SupabaseClient;
  bookingId: string;
  userId?: string;
};

function resolveBookingStatus(value: string): BookingStatus {
  if (value === "cancelled" || value === "rescheduled" || value === "confirmed") {
    return value;
  }
  return "confirmed";
}

function resolveSeatClass(value: string): SeatClass {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return "economy";
}

function takeSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getBookingDetails({
  supabase,
  bookingId,
  userId
}: GetBookingDetailsInput): Promise<BookingDetails | null> {
  if (!isUuid(bookingId)) {
    return null;
  }

  let bookingQuery = supabase
    .from("bookings")
    .select(
      "id, status, booked_at, total_price, pnr_code, flights:flight_id(id, flight_no, airline, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price), seats:seat_id(id, seat_number, class, extra_fee, is_available), passengers(id, full_name, passport_no, nationality, dob)"
    )
    .eq("id", bookingId);

  if (userId) {
    bookingQuery = bookingQuery.eq("user_id", userId);
  }

  const { data, error } = await bookingQuery.single<BookingRow>();

  if (error || !data) {
    return null;
  }

  const flight = takeSingle(data.flights);
  const seat = takeSingle(data.seats);
  if (!flight || !seat) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return {
    booking: {
      id: data.id,
      status: resolveBookingStatus(data.status),
      bookedAt: data.booked_at,
      totalPrice: Number(data.total_price),
      pnrCode: data.pnr_code
    },
    flight: {
      id: flight.id,
      flightNo: flight.flight_no,
      airline: flight.airline ?? "FlyAhead",
      origin: flight.origin,
      destination: flight.destination,
      departsAt: flight.departs_at,
      arrivesAt: flight.arrives_at,
      aircraftType: flight.aircraft_type,
      status: flight.status,
      basePrice: Number(flight.base_price)
    },
    seat: {
      id: seat.id,
      seatNumber: seat.seat_number,
      seatClass: resolveSeatClass(seat.class),
      extraFee: Number(seat.extra_fee ?? 0),
      isAvailable: seat.is_available
    },
    passengers: (data.passengers ?? []).map((passenger) => ({
      id: passenger.id,
      fullName: passenger.full_name,
      passportNo: passenger.passport_no,
      nationality: passenger.nationality,
      dateOfBirth: passenger.dob
    })),
    userEmail: user?.email ?? null
  };
}
