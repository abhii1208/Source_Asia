import StatusBadge from "@/components/ui/StatusBadge";
import { cabinClassLabels } from "@/lib/mock-data";
import type { CabinClass, Flight } from "@/lib/types";
import { formatCurrency, formatDuration, formatTime } from "@/lib/utils";

type BookingSummaryProps = {
  flight: Flight;
  cabinClass: CabinClass;
  seat?: string | null;
  extraCharge?: number;
};

export default function BookingSummary({ flight, cabinClass, seat, extraCharge = 0 }: BookingSummaryProps) {
  const total = flight.classPrices[cabinClass] + extraCharge;

  return (
    <aside className="glass-panel rounded-2xl p-6 shadow-glass h-fit">
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">Flight Summary</h3>
      <div className="border-t border-outline-variant/30 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-headline-lg text-headline-lg leading-none">{flight.origin}</p>
            <p className="text-on-surface-variant">{formatTime(flight.departsAt)}</p>
          </div>
          <div className="text-center">
            <p className="font-mono-data text-mono-data text-primary">Direct | {formatDuration(flight.durationMinutes)}</p>
            <span className="material-symbols-outlined text-outline">flight</span>
          </div>
          <div className="text-right">
            <p className="font-headline-lg text-headline-lg leading-none">{flight.destination}</p>
            <p className="text-on-surface-variant">{formatTime(flight.arrivesAt)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">Flight</p>
          <p className="font-mono-data text-mono-data">{flight.flightNo}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">Aircraft</p>
          <p>{flight.aircraftType}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">Class</p>
          <p>{cabinClassLabels[cabinClass]}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">Seat</p>
          <p>{seat ?? "--"}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">Status</p>
          <StatusBadge status={flight.status} />
        </div>
        <div className="border-t border-outline-variant/30 pt-3 flex items-center justify-between">
          <p className="font-headline-md text-headline-md">Total</p>
          <p className="font-headline-lg text-headline-lg text-primary">{formatCurrency(total)}</p>
        </div>
      </div>
    </aside>
  );
}
