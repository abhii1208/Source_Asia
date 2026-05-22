import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import { getBookingDetails } from "@/lib/bookings/get-booking-details";
import { sendTicketEmail, type TicketEmailStatus } from "@/lib/email/send-ticket-email";

const passengerSchema = z.object({
  full_name: z.string().trim().min(3),
  passport_no: z
    .string()
    .trim()
    .min(6)
    .max(16)
    .regex(/^[A-Z0-9]+$/i),
  nationality: z.string().trim().min(2),
  dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const createBookingSchema = z.object({
  flight_id: z.string().uuid(),
  seat_id: z.string().uuid(),
  passengers: z.array(passengerSchema).min(1),
  total_price: z.number().finite().positive()
});

type CreateBookingPayload = z.infer<typeof createBookingSchema>;

function generatePnrCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pnr = "AM";

  for (let index = 0; index < 6; index += 1) {
    pnr += chars[Math.floor(Math.random() * chars.length)];
  }

  return pnr;
}

function normalizePayload(payload: CreateBookingPayload): CreateBookingPayload {
  return {
    ...payload,
    passengers: payload.passengers.map((passenger) => ({
      full_name: passenger.full_name.trim(),
      passport_no: passenger.passport_no.trim().toUpperCase(),
      nationality: passenger.nationality.trim(),
      dob: passenger.dob.trim()
    }))
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
      { success: false, message: "Unable to confirm ticket right now. Please try again." },
      { status: 500 }
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Please login to confirm your ticket."
      },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Passenger details are incomplete."
      },
      { status: 400 }
    );
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Passenger details are incomplete."
      },
      { status: 400 }
    );
  }

  const payload = normalizePayload(parsed.data);
  const pnrCode = generatePnrCode();

  const { data: rpcResult, error: rpcError } = await supabase.rpc("reserve_seat_and_create_booking", {
    p_flight_id: payload.flight_id,
    p_seat_id: payload.seat_id,
    p_total_price: payload.total_price,
    p_pnr_code: pnrCode,
    p_passengers: payload.passengers
  });

  if (rpcError) {
    const lowerMessage = rpcError.message.toLowerCase();

    if (lowerMessage.includes("authentication required")) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to confirm your ticket."
        },
        { status: 401 }
      );
    }

    if (lowerMessage.includes("seat is no longer available") || lowerMessage.includes("seat is not available")) {
      return NextResponse.json(
        {
          success: false,
          message: "This seat was just booked. Please select another seat."
        },
        { status: 409 }
      );
    }

    if (lowerMessage.includes("passenger")) {
      return NextResponse.json(
        {
          success: false,
          message: "Passenger details are incomplete."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to confirm ticket right now. Please try again."
      },
      { status: 500 }
    );
  }

  const bookingId = typeof rpcResult === "string" ? rpcResult : null;
  if (!bookingId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to confirm ticket right now. Please try again."
      },
      { status: 500 }
    );
  }

  let emailSent = false;
  let emailStatus: TicketEmailStatus = "failed";

  const details = await getBookingDetails({
    supabase,
    bookingId,
    userId: user.id
  });

  if (details) {
    const emailResult = await sendTicketEmail({
      to: details.userEmail ?? user.email ?? null,
      booking: details.booking,
      flight: details.flight,
      seat: details.seat,
      passengers: details.passengers
    });
    emailSent = emailResult.emailSent;
    emailStatus = emailResult.emailStatus;
  }

  return NextResponse.json({
    success: true,
    bookingId,
    pnrCode,
    emailSent,
    emailStatus
  });
}
