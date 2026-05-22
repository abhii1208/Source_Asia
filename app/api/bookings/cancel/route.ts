import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import type { CancelBookingInput } from "@/lib/types";
import { isUuid } from "@/lib/booking-data";

function parseInput(value: unknown): CancelBookingInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<CancelBookingInput>;
  if (typeof candidate.booking_id !== "string" || !isUuid(candidate.booking_id)) {
    return null;
  }

  return {
    booking_id: candidate.booking_id
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
    return NextResponse.json({ success: false, message: "booking_id must be a valid UUID." }, { status: 400 });
  }

  const { error } = await supabase.rpc("cancel_booking_atomic", {
    p_booking_id: input.booking_id
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("cancellation is blocked within 2 hours of departure")) {
      return NextResponse.json(
        {
          success: false,
          message: "Cancellation is blocked because this flight departs within 2 hours."
        },
        { status: 409 }
      );
    }

    if (message.includes("booking not found") || message.includes("not allowed")) {
      return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "Unable to cancel booking right now." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
