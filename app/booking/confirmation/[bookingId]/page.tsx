import Link from "next/link";
import { redirect } from "next/navigation";
import PrintTicketButton from "@/components/booking/PrintTicketButton";
import { getBookingDetails } from "@/lib/bookings/get-booking-details";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import { isUuid } from "@/lib/booking-data";
import { formatCurrency, formatDateTime, toTitleCase } from "@/lib/utils";

type ConfirmationPageProps = {
  params: {
    bookingId: string;
  };
  searchParams?: {
    emailSent?: string;
    emailStatus?: string;
  };
};

function resolveEmailNotice(searchParams: ConfirmationPageProps["searchParams"]): string {
  const emailSent = searchParams?.emailSent === "true";
  const emailStatus = searchParams?.emailStatus;

  if (emailSent || emailStatus === "sent") {
    return "We've sent your ticket to your registered email.";
  }

  if (emailStatus === "not_configured") {
    return "Ticket confirmed. Email delivery is not configured in this environment.";
  }

  return "Your ticket is ready. You can print it or view it anytime from My Bookings.";
}

function renderErrorCard(title: string, message: string) {
  return (
    <section className="max-w-3xl mx-auto px-gutter py-12">
      <div className="glass-panel rounded-2xl p-6 shadow-glass">
        <h1 className="font-headline-md text-headline-md text-on-surface">{title}</h1>
        <p className="text-on-surface-variant mt-2">{message}</p>
        <Link href="/my-bookings" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2 text-on-primary no-print">
          Go to My Bookings
        </Link>
      </div>
    </section>
  );
}

export default async function BookingConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const bookingId = params.bookingId ?? "";
  if (!isUuid(bookingId)) {
    return renderErrorCard("Invalid booking reference", "Please open your booking again from My Bookings.");
  }

  const envError = getSupabaseServerClientError();
  if (envError) {
    return renderErrorCard("Supabase configuration missing", envError);
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return renderErrorCard("Unable to load confirmation", "Supabase server client is not available.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/booking/confirmation/${bookingId}`);
  }

  const details = await getBookingDetails({
    supabase,
    bookingId,
    userId: user.id
  });

  if (!details) {
    return renderErrorCard(
      "Booking not found",
      "We could not locate this booking in your account. Please check My Bookings."
    );
  }

  const notice = resolveEmailNotice(searchParams);
  const ticketCardSelector = `#ticket-card-${details.booking.id}`;

  return (
    <section className="max-w-5xl mx-auto px-gutter py-10">
      <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Thank you for booking with AeroMint</h1>
        <p className="text-on-surface-variant mt-1">Your ticket has been confirmed successfully.</p>
        <p className="mt-4 rounded-xl border border-primary/35 bg-primary-container/20 px-4 py-3 text-sm text-primary">
          {notice}
        </p>

        <article id={`ticket-card-${details.booking.id}`} className="ticket-print-card mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/35 pb-4">
            <div>
              <p className="text-on-surface-variant text-sm">PNR Code</p>
              <p className="font-headline-lg text-headline-lg text-primary">{details.booking.pnrCode}</p>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-sm">Booking Status</p>
              <p className="font-headline-md text-headline-md">{toTitleCase(details.booking.status)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant/35 bg-white/80 p-4">
              <h2 className="font-headline-md text-headline-md mb-2">Flight Details</h2>
              <p>Flight Number: {details.flight.flightNo}</p>
              <p>Airline: {details.flight.airline}</p>
              <p>Origin: {details.flight.origin}</p>
              <p>Destination: {details.flight.destination}</p>
              <p>Departure: {formatDateTime(details.flight.departsAt)}</p>
              <p>Arrival: {formatDateTime(details.flight.arrivesAt)}</p>
              <p>Aircraft Type: {details.flight.aircraftType}</p>
            </div>

            <div className="rounded-xl border border-outline-variant/35 bg-white/80 p-4">
              <h2 className="font-headline-md text-headline-md mb-2">Seat & Fare</h2>
              <p>Seat Number: {details.seat.seatNumber}</p>
              <p>Seat Class: {toTitleCase(details.seat.seatClass)}</p>
              <p>Total Price: {formatCurrency(details.booking.totalPrice)}</p>
              <p>Booked Date: {formatDateTime(details.booking.bookedAt)}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-outline-variant/35 bg-white/80 p-4">
            <h2 className="font-headline-md text-headline-md mb-2">Passenger Details</h2>
            {details.passengers.length === 0 ? (
              <p className="text-on-surface-variant">Passenger details are unavailable for this ticket.</p>
            ) : (
              <ul className="space-y-3">
                {details.passengers.map((passenger) => (
                  <li key={passenger.id} className="rounded-xl border border-outline-variant/25 p-3">
                    <p className="text-on-surface">{passenger.fullName}</p>
                    <p className="text-on-surface-variant text-sm">Nationality: {passenger.nationality}</p>
                    <p className="text-on-surface-variant text-sm">DOB: {passenger.dateOfBirth}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        <div className="no-print mt-6 flex flex-wrap gap-3">
          <PrintTicketButton label="Print Ticket" ticketSelector={ticketCardSelector} />
          <Link
            href="/my-bookings"
            className="rounded-xl bg-primary text-on-primary px-5 py-3 hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
          >
            View My Bookings
          </Link>
          <Link
            href="/search"
            className="rounded-xl border border-primary text-primary px-5 py-3 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            Book Another Flight
          </Link>
        </div>
      </div>
    </section>
  );
}
