import "server-only";
import { Resend } from "resend";
import type { BookingDetails } from "@/lib/bookings/get-booking-details";

export type TicketEmailStatus = "sent" | "not_configured" | "failed";
export type TicketEmailReason = "missing_config" | "missing_user_email" | "send_failed";

type SendTicketEmailInput = {
  to: string;
  booking: BookingDetails["booking"];
  flight: BookingDetails["flight"];
  seat: BookingDetails["seat"];
  passengers: BookingDetails["passengers"];
};

type SendTicketEmailResult = {
  emailSent: boolean;
  emailStatus: TicketEmailStatus;
  emailReason?: TicketEmailReason;
};

type TicketEmailConfigState = {
  resendConfigured: boolean;
  emailFromConfigured: boolean;
  configured: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderPassengerRows(passengers: BookingDetails["passengers"]): string {
  return passengers
    .map(
      (passenger) =>
        `<li><strong>${escapeHtml(passenger.fullName)}</strong> (${escapeHtml(passenger.nationality)}) - DOB ${escapeHtml(
          passenger.dateOfBirth
        )}</li>`
    )
    .join("");
}

function buildEmailHtml({
  booking,
  flight,
  seat,
  passengers
}: Omit<SendTicketEmailInput, "to">): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const myBookingsUrl = appUrl ? `${appUrl.replace(/\/+$/, "")}/my-bookings` : null;

  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin: 0 0 8px;">Thank you for booking with FlyAhead</h2>
      <p style="margin: 0 0 16px;">Your ticket has been confirmed successfully.</p>
      <p style="margin: 0 0 16px;"><strong>PNR:</strong> ${escapeHtml(booking.pnrCode)}</p>
      <p style="margin: 0;"><strong>Route:</strong> ${escapeHtml(flight.origin)} to ${escapeHtml(flight.destination)}</p>
      <p style="margin: 0;"><strong>Flight:</strong> ${escapeHtml(flight.flightNo)} (${escapeHtml(flight.airline)})</p>
      <p style="margin: 0;"><strong>Departure:</strong> ${escapeHtml(formatDateTime(flight.departsAt))}</p>
      <p style="margin: 0 0 8px;"><strong>Arrival:</strong> ${escapeHtml(formatDateTime(flight.arrivesAt))}</p>
      <p style="margin: 0;"><strong>Seat:</strong> ${escapeHtml(seat.seatNumber)} (${escapeHtml(seat.seatClass)})</p>
      <p style="margin: 0 0 8px;"><strong>Total Paid:</strong> INR ${Math.round(booking.totalPrice).toLocaleString("en-IN")}</p>
      <p style="margin: 0 0 6px;"><strong>Passengers:</strong></p>
      <ul style="margin-top: 0;">
        ${renderPassengerRows(passengers)}
      </ul>
      ${
        myBookingsUrl
          ? `<p style="margin: 16px 0 0;">View your trips anytime: <a href="${escapeHtml(
              myBookingsUrl
            )}" style="color: #0f766e;">My Bookings</a></p>`
          : ""
      }
    </div>
  `;
}

export function getTicketEmailConfigState(): TicketEmailConfigState {
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const emailFromConfigured = Boolean(process.env.EMAIL_FROM?.trim());
  return {
    resendConfigured,
    emailFromConfigured,
    configured: resendConfigured && emailFromConfigured
  };
}

export async function sendTicketEmail(input: SendTicketEmailInput): Promise<SendTicketEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const emailFrom = process.env.EMAIL_FROM?.trim() ?? "";
  const configState = getTicketEmailConfigState();

  if (!configState.configured) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Ticket email delivery is not configured: missing RESEND_API_KEY or EMAIL_FROM.");
    }
    return { emailSent: false, emailStatus: "not_configured", emailReason: "missing_config" };
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: emailFrom,
      to: input.to,
      subject: `FlyAhead Ticket Confirmed - PNR ${input.booking.pnrCode}`,
      html: buildEmailHtml(input)
    });
    return { emailSent: true, emailStatus: "sent" };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to send ticket confirmation email.", error);
    }
    return { emailSent: false, emailStatus: "failed", emailReason: "send_failed" };
  }
}
