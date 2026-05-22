import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import type { RescheduleBookingInput, RescheduleBookingResponse } from "@/lib/types";
import { isUuid } from "@/lib/booking-data";

type BookingRpcRow = {
  id: string;
  flight_id: string;
  seat_id: string;
  total_price: number | string;
  status: string;
};

type FlightRpcRow = {
  id: string;
  origin: string;
  destination: string;
  base_price: number | string;
};

type SeatRpcRow = {
  id: string;
  flight_id: string;
  extra_fee: number | string | null;
  is_available: boolean;
};

function parseInput(value: unknown): RescheduleBookingInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<RescheduleBookingInput>;

  if (
    typeof candidate.booking_id !== "string" ||
    typeof candidate.new_flight_id !== "string" ||
    typeof candidate.new_seat_id !== "string"
  ) {
    return null;
  }

  if (!isUuid(candidate.booking_id) || !isUuid(candidate.new_flight_id) || !isUuid(candidate.new_seat_id)) {
    return null;
  }

  return {
    booking_id: candidate.booking_id,
    new_flight_id: candidate.new_flight_id,
    new_seat_id: candidate.new_seat_id
  };
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
        message: "booking_id, new_flight_id, and new_seat_id must be valid UUID values."
      },
      { status: 400 }
    );
  }

  const bookingResponse = await supabase
    .from("bookings")
    .select("id, flight_id, seat_id, total_price, status")
    .eq("id", input.booking_id)
    .single<BookingRpcRow>();

  if (bookingResponse.error || !bookingResponse.data) {
    return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
  }

  const booking = bookingResponse.data;
  if (booking.status === "cancelled") {
    return NextResponse.json(
      { success: false, message: "Cancelled bookings cannot be rescheduled." },
      { status: 400 }
    );
  }

  const [oldFlightResponse, newFlightResponse, oldSeatResponse, newSeatResponse] = await Promise.all([
    supabase
      .from("flights")
      .select("id, origin, destination, base_price")
      .eq("id", booking.flight_id)
      .single<FlightRpcRow>(),
    supabase
      .from("flights")
      .select("id, origin, destination, base_price")
      .eq("id", input.new_flight_id)
      .single<FlightRpcRow>(),
    supabase
      .from("seats")
      .select("id, flight_id, extra_fee, is_available")
      .eq("id", booking.seat_id)
      .single<SeatRpcRow>(),
    supabase
      .from("seats")
      .select("id, flight_id, extra_fee, is_available")
      .eq("id", input.new_seat_id)
      .single<SeatRpcRow>()
  ]);

  if (oldFlightResponse.error || !oldFlightResponse.data) {
    return NextResponse.json({ success: false, message: "Current flight not found." }, { status: 404 });
  }

  if (newFlightResponse.error || !newFlightResponse.data) {
    return NextResponse.json({ success: false, message: "Selected flight not found." }, { status: 404 });
  }

  if (oldSeatResponse.error || !oldSeatResponse.data) {
    return NextResponse.json({ success: false, message: "Current seat not found." }, { status: 404 });
  }

  if (newSeatResponse.error || !newSeatResponse.data) {
    return NextResponse.json({ success: false, message: "Selected seat not found." }, { status: 404 });
  }

  const oldFlight = oldFlightResponse.data;
  const newFlight = newFlightResponse.data;
  const newSeat = newSeatResponse.data;

  if (oldFlight.origin !== newFlight.origin || oldFlight.destination !== newFlight.destination) {
    return NextResponse.json(
      { success: false, message: "Selected flight must have the same origin and destination." },
      { status: 400 }
    );
  }

  if (newSeat.flight_id !== newFlight.id) {
    return NextResponse.json(
      { success: false, message: "Selected seat does not belong to the selected flight." },
      { status: 400 }
    );
  }

  if (!newSeat.is_available) {
    return NextResponse.json({ success: false, message: "Selected seat is no longer available." }, { status: 409 });
  }

  const newTotal = Number(newFlight.base_price) + Number(newSeat.extra_fee ?? 0);
  const currentTotal = Number(booking.total_price);
  const feeCharged = Math.max(0, newTotal - currentTotal);

  const { data, error } = await supabase.rpc("reschedule_booking_atomic", {
    p_booking_id: input.booking_id,
    p_new_flight_id: input.new_flight_id,
    p_new_seat_id: input.new_seat_id,
    p_fee_charged: feeCharged
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("same origin and destination")) {
      return NextResponse.json(
        { success: false, message: "Selected flight must have the same origin and destination." },
        { status: 400 }
      );
    }

    if (message.includes("new seat is not available") || message.includes("seat is no longer available")) {
      return NextResponse.json({ success: false, message: "Selected seat is no longer available." }, { status: 409 });
    }

    if (message.includes("cancelled bookings cannot be rescheduled")) {
      return NextResponse.json(
        { success: false, message: "Cancelled bookings cannot be rescheduled." },
        { status: 400 }
      );
    }

    if (message.includes("booking not found") || message.includes("not allowed")) {
      return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "Unable to reschedule booking right now." }, { status: 500 });
  }

  const response: RescheduleBookingResponse = {
    success: true,
    bookingId: typeof data === "string" && data ? data : input.booking_id,
    feeCharged
  };

  return NextResponse.json(response);
}
