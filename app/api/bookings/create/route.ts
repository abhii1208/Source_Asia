import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import { getBookingDetails } from "@/lib/bookings/get-booking-details";
import { sendTicketEmail } from "@/lib/email/send-ticket-email";
import type { BookingCreateInput, PassengerInput } from "@/lib/types";

const passportPattern = /^[A-Z0-9]{6,16}$/i;

const passengerSchema = z
  .object({
    full_name: z.string().trim().min(3),
    passport_no: z.union([z.string(), z.literal(""), z.null()]).optional(),
    nationality: z.string().trim().min(2),
    dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
  .superRefine((passenger, context) => {
    const passportValue = passenger.passport_no?.toString().trim() ?? "";
    if (passportValue.length > 0 && !passportPattern.test(passportValue)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passport_no"],
        message: "Passport number should be 6-16 letters/numbers."
      });
    }
  });

const createBookingSchema = z.object({
  flight_id: z.string().uuid(),
  seat_id: z.string().uuid(),
  passengers: z.array(passengerSchema).min(1),
  total_price: z.number().finite().positive()
});

type ParsedBookingInput = z.infer<typeof createBookingSchema>;
type NormalizedPassengerInput = Omit<PassengerInput, "passport_no"> & { passport_no: string | null };
type NormalizedBookingInput = Omit<BookingCreateInput, "passengers"> & { passengers: NormalizedPassengerInput[] };
type RpcResponse = {
  bookingId: string | null;
  errorMessage: string | null;
};

function generatePnrCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pnr = "AM";

  for (let index = 0; index < 6; index += 1) {
    pnr += chars[Math.floor(Math.random() * chars.length)];
  }

  return pnr;
}

function normalizePayload(payload: ParsedBookingInput): NormalizedBookingInput {
  return {
    flight_id: payload.flight_id,
    seat_id: payload.seat_id,
    total_price: payload.total_price,
    passengers: payload.passengers.map((passenger) => ({
      full_name: passenger.full_name.trim(),
      passport_no: passenger.passport_no?.toString().trim().toUpperCase() || null,
      nationality: passenger.nationality.trim(),
      dob: passenger.dob.trim()
    }))
  };
}

function mapValidationError(error: z.ZodError<ParsedBookingInput>): string {
  for (const issue of error.issues) {
    const path = issue.path;
    const firstSegment = path[0];
    const passengerField = path[2];

    if (firstSegment === "flight_id") {
      return "Selected flight is invalid. Please choose a flight again.";
    }

    if (firstSegment === "seat_id") {
      return "Please select a seat before confirming.";
    }

    if (firstSegment === "total_price") {
      return "Unable to confirm this fare. Please refresh and try again.";
    }

    if (firstSegment === "passengers" && (passengerField === "full_name" || passengerField === "nationality" || passengerField === "dob")) {
      return "Please complete required passenger details.";
    }

    if (firstSegment === "passengers") {
      return "Please complete required passenger details.";
    }
  }

  return "Unable to confirm ticket right now. Please try again.";
}

function shouldRetryWithFallbackPassport(errorMessage: string, passengers: NormalizedPassengerInput[]): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  const hasMissingPassport = passengers.some((passenger) => !passenger.passport_no);

  if (!hasMissingPassport) {
    return false;
  }

  return (
    (lowerMessage.includes("passport_no") || lowerMessage.includes("passport")) &&
    (lowerMessage.includes("null value") || lowerMessage.includes("not-null"))
  );
}

function fallbackPassport(index: number): string {
  const randomChunk = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FA${randomChunk}${index}`;
}

async function reserveBooking(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  payload: NormalizedBookingInput,
  pnrCode: string
): Promise<RpcResponse> {
  if (!supabase) {
    return { bookingId: null, errorMessage: "Supabase client unavailable" };
  }

  const { data, error } = await supabase.rpc("reserve_seat_and_create_booking", {
    p_flight_id: payload.flight_id,
    p_seat_id: payload.seat_id,
    p_total_price: payload.total_price,
    p_pnr_code: pnrCode,
    p_passengers: payload.passengers
  });

  return {
    bookingId: typeof data === "string" ? data : null,
    errorMessage: error?.message ?? null
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
        message: "Please complete required passenger details."
      },
      { status: 400 }
    );
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    const message = mapValidationError(parsed.error);
    const statusCode = message.includes("seat") ? 400 : 422;
    return NextResponse.json({ success: false, message }, { status: statusCode });
  }

  const payload = normalizePayload(parsed.data);
  const pnrCode = generatePnrCode();

  let rpcResponse = await reserveBooking(supabase, payload, pnrCode);

  if (
    rpcResponse.errorMessage &&
    shouldRetryWithFallbackPassport(rpcResponse.errorMessage, payload.passengers)
  ) {
    const retryPayload: NormalizedBookingInput = {
      ...payload,
      passengers: payload.passengers.map((passenger, index) => ({
        ...passenger,
        passport_no: passenger.passport_no ?? fallbackPassport(index)
      }))
    };

    rpcResponse = await reserveBooking(supabase, retryPayload, pnrCode);
  }

  if (rpcResponse.errorMessage) {
    const lowerMessage = rpcResponse.errorMessage.toLowerCase();

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

    if (lowerMessage.includes("seat not found")) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a seat before confirming."
        },
        { status: 400 }
      );
    }

    if (
      lowerMessage.includes("passenger") ||
      lowerMessage.includes("full_name") ||
      lowerMessage.includes("nationality") ||
      lowerMessage.includes("dob")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete required passenger details."
        },
        { status: 422 }
      );
    }

    if (lowerMessage.includes("passport_no") || lowerMessage.includes("passport")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passport validation failed in the database. Please refresh and try again. If it continues, run the latest Supabase migrations."
        },
        { status: 422 }
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

  const bookingId = rpcResponse.bookingId;
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
  let emailStatus: "sent" | "not_configured" | "failed" = "failed";

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
