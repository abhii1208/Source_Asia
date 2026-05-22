import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import PrintTicketButton from "@/components/booking/PrintTicketButton";
import type { BookingWithDetails } from "@/lib/types";
import { formatCurrency, formatDateTime, formatDuration, formatTime } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

type BookingCardProps = {
  booking: BookingWithDetails;
  onCancel: (bookingId: string) => void;
  onReschedule: (bookingId: string) => void;
  disabled?: boolean;
};

function toClassLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function BookingCard({ booking, onCancel, onReschedule, disabled = false }: BookingCardProps) {
  const passengerNames = booking.passengers.map((passenger) => passenger.fullName).join(", ");
  const canCancel = booking.status !== "cancelled";
  const canReschedule = booking.status !== "cancelled";
  const emailStatus = useUserStore((state) => state.ticketEmailStatus[booking.id]);
  const ticketSelector = `#ticket-card-${booking.id}`;

  return (
    <article id={`ticket-card-${booking.id}`} className="ticket-print-card glass-panel rounded-2xl p-5 md:p-7 shadow-soft border border-white/35">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status={booking.status} />
              <span className="rounded-lg border border-outline-variant/40 px-3 py-1 font-mono-data text-mono-data bg-surface-container-lowest">
                PNR: {booking.pnrCode}
              </span>
            </div>
            <p className="text-on-surface-variant text-mono-data">{formatDateTime(booking.flight.departsAt)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="font-headline-lg text-headline-lg leading-none">{booking.flight.origin}</p>
              <p className="text-on-surface-variant">{formatTime(booking.flight.departsAt)}</p>
            </div>
            <div className="text-center">
              <p className="text-on-surface-variant text-mono-data">
                {formatDuration(booking.flight.durationMinutes)} | Direct
              </p>
              <span className="material-symbols-outlined text-primary text-[22px]">flight</span>
              <p className="text-primary text-body-md">{booking.flight.flightNo}</p>
            </div>
            <div className="md:text-right">
              <p className="font-headline-lg text-headline-lg leading-none">{booking.flight.destination}</p>
              <p className="text-on-surface-variant">{formatTime(booking.flight.arrivesAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-body-md text-on-surface-variant">
            <span>Class: {toClassLabel(booking.seat.seatClass)}</span>
            <span>Seat: {booking.seat.seatNumber}</span>
            <span>Aircraft: {booking.flight.aircraftType}</span>
            <span>Total: {formatCurrency(booking.totalPrice)}</span>
            <span>Booked: {formatDateTime(booking.bookedAt)}</span>
            <span>Passenger: {passengerNames || "Passenger details unavailable"}</span>
          </div>
          {emailStatus === "sent" ? (
            <p className="text-sm text-primary">Email sent to registered user after booking.</p>
          ) : null}
        </div>

        <div className="no-print flex xl:flex-col gap-2 xl:w-[220px]">
          <PrintTicketButton label="Print Ticket" ticketSelector={ticketSelector} className="flex-1" />
          <Link
            href={`/my-bookings/${booking.id}`}
            className="flex-1 text-center rounded-xl border border-primary text-primary px-4 py-3 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => onReschedule(booking.id)}
            disabled={!canReschedule || disabled}
            className="flex-1 rounded-xl bg-primary text-on-primary px-4 py-3 hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Reschedule
          </button>
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            disabled={!canCancel || disabled}
            className="flex-1 rounded-xl border border-error text-error px-4 py-3 hover:bg-error hover:text-on-error transition-colors focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </article>
  );
}
