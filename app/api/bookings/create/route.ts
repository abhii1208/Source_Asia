import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import type { CabinClass } from "@/lib/types";
import { isUuid } from "@/lib/booking-data";

type PassengerInput = {
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
};

type CreateBookingInput = {
  flight_id: string;
  seat_id: string;
  cabin_class: CabinClass;
  passenger: PassengerInput;
};

type FlightPriceRow = {
  id: string;
  base_price: number | string;
};

type SeatPriceRow = {
  id: string;
  flight_id: string;
  extra_fee: number | string | null;
  is_available: boolean;
};

function toCabinClass(value: unknown): CabinClass | null {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return null;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parsePassenger(value: unknown): PassengerInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<PassengerInput>;

  if (
    typeof candidate.full_name !== "string" ||
    typeof candidate.passport_no !== "string" ||
    typeof candidate.nationality !== "string" ||
    typeof candidate.dob !== "string"
  ) {
    return null;
  }

  const fullName = candidate.full_name.trim();
  const passport = candidate.passport_no.trim().toUpperCase();
  const nationality = candidate.nationality.trim();
  const dob = candidate.dob.trim();

  if (fullName.length < 3 || !/^[A-Z0-9]{6,10}$/.test(passport) || nationality.length < 2 || !isIsoDate(dob)) {
    return null;
  }

  return {
    full_name: fullName,
    passport_no: passport,
    nationality,
    dob
  };
}

function parseInput(value: unknown): CreateBookingInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<CreateBookingInput>;
  const cabinClass = toCabinClass(candidate.cabin_class);
  const passenger = parsePassenger(candidate.passenger);

  if (
    typeof candidate.flight_id !== "string" ||
    typeof candidate.seat_id !== "string" ||
    !isUuid(candidate.flight_id) ||
    !isUuid(candidate.seat_id) ||
    !cabinClass ||
    !passenger
  ) {
    return null;
  }

  return {
    flight_id: candidate.flight_id,
    seat_id: candidate.seat_id,
    cabin_class: cabinClass,
    passenger
  };
}

function cabinMultiplier(cabinClass: CabinClass): number {
  if (cabinClass === "business") {
    return 2.1;
  }
  if (cabinClass === "first") {
    return 3.4;
  }
  return 1;
}

function generatePnrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "AM";
  for (let index = 0; index < 6; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
}

export async function POST(request: Request) {
  const envError = getSupabaseServerClientError();
  if (envError) {
    return NextResponse.json({ success: false, message: envError }, { status: 500 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase server client is not available." },
      { status: 500 }
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request payload." }, { status: 400 });
  }

  const input = parseInput(payload);
  if (!input) {
    return NextResponse.json(
      {
        success: false,
        message: "flight_id, seat_id, cabin_class, and passenger details are required in valid format."
      },
      { status: 400 }
    );
  }

  const [flightResponse, seatResponse] = await Promise.all([
    supabase.from("flights").select("id, base_price").eq("id", input.flight_id).single<FlightPriceRow>(),
    supabase
      .from("seats")
      .select("id, flight_id, extra_fee, is_available")
      .eq("id", input.seat_id)
      .single<SeatPriceRow>()
  ]);

  if (flightResponse.error || !flightResponse.data) {
    return NextResponse.json({ success: false, message: "Selected flight not found." }, { status: 404 });
  }

  if (seatResponse.error || !seatResponse.data) {
    return NextResponse.json({ success: false, message: "Selected seat not found." }, { status: 404 });
  }

  const seat = seatResponse.data;
  if (seat.flight_id !== input.flight_id) {
    return NextResponse.json(
      { success: false, message: "Selected seat does not belong to the selected flight." },
      { status: 400 }
    );
  }

  if (!seat.is_available) {
    return NextResponse.json({ success: false, message: "Selected seat is no longer available." }, { status: 409 });
  }

  const basePrice = Number(flightResponse.data.base_price);
  const seatFee = Number(seat.extra_fee ?? 0);
  const totalPrice = Math.round(basePrice * cabinMultiplier(input.cabin_class) + seatFee);
  const pnrCode = generatePnrCode();

  const { data, error } = await supabase.rpc("reserve_seat_and_create_booking", {
    p_flight_id: input.flight_id,
    p_seat_id: input.seat_id,
    p_total_price: totalPrice,
    p_pnr_code: pnrCode,
    p_passengers: [
      {
        full_name: input.passenger.full_name,
        passport_no: input.passenger.passport_no,
        nationality: input.passenger.nationality,
        dob: input.passenger.dob
      }
    ]
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("seat is no longer available")) {
      return NextResponse.json({ success: false, message: "Selected seat is no longer available." }, { status: 409 });
    }

    if (message.includes("authentication required")) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: "Unable to create booking right now." }, { status: 500 });
  }

  const bookingId = typeof data === "string" ? data : null;
  if (!bookingId) {
    return NextResponse.json({ success: false, message: "Booking could not be created." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    bookingId,
    pnr: pnrCode,
    totalPrice
  });
}
