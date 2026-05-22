"use client";

import Link from "next/link";
import type { Booking, Flight } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type ConfirmationCardProps = {
  booking: Booking;
  flight: Flight;
};

export default function ConfirmationCard({ booking, flight }: ConfirmationCardProps) {
  function printTicket() {
    window.print();
  }

  return (
    <section className="max-w-3xl mx-auto px-gutter py-12">
      <div className="glass-panel rounded-2xl p-8 shadow-glass">
        <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl">check</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Booking Confirmed</h1>
        <p className="text-on-surface-variant mb-8">
          Your trip is locked in. Save this ticket or open My Bookings anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4">
            <p className="text-on-surface-variant text-sm">PNR</p>
            <p className="font-headline-md text-headline-md">{booking.pnr}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4">
            <p className="text-on-surface-variant text-sm">Booking ID</p>
            <p className="font-mono-data text-mono-data">{booking.id}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4">
            <p className="text-on-surface-variant text-sm">Flight</p>
              <p className="font-headline-md text-headline-md">
                {flight.origin} to {flight.destination}
              </p>
            <p className="text-on-surface-variant">{flight.flightNo}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4">
            <p className="text-on-surface-variant text-sm">Passenger</p>
            <p className="font-headline-md text-headline-md">{booking.traveler.fullName}</p>
            <p className="text-on-surface-variant">Seat {booking.seat}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4">
            <p className="text-on-surface-variant text-sm">Booked At</p>
            <p>{formatDateTime(booking.bookedAt)}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4">
            <p className="text-on-surface-variant text-sm">Total Paid</p>
            <p className="font-headline-md text-headline-md text-primary">{formatCurrency(booking.totalPrice)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
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
          <button
            type="button"
            onClick={printTicket}
            className="rounded-xl border border-outline text-on-surface px-5 py-3 hover:bg-surface-container-low transition-colors focus-ring"
          >
            Download Ticket / Print Ticket
          </button>
        </div>
      </div>
    </section>
  );
}
