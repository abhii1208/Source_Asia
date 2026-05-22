"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import type { CabinClass, Flight } from "@/lib/types";
import { cn, formatCurrency, formatDuration, formatTime } from "@/lib/utils";

type FlightCardProps = {
  flight: Flight;
  recommended?: boolean;
  onSelect: (flight: Flight, cabinClass: CabinClass) => void;
};

const classOrder: CabinClass[] = ["economy", "business", "first"];

export default function FlightCard({ flight, onSelect, recommended = false }: FlightCardProps) {
  const availableClasses = flight.availableCabinClasses?.length ? flight.availableCabinClasses : classOrder;
  const [activeClass, setActiveClass] = useState<CabinClass>(availableClasses.includes("economy") ? "economy" : availableClasses[0]);
  const duration = useMemo(() => formatDuration(flight.durationMinutes), [flight.durationMinutes]);
  const tags = flight.tags?.slice(0, 3) ?? [];

  return (
    <article
      className={cn(
        "glass-panel rounded-2xl p-5 md:p-8 relative border border-white/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass animate-fade-up",
        recommended ? "ring-2 ring-primary/70" : ""
      )}
    >
      <span className="absolute left-6 right-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      {recommended ? (
        <span className="absolute top-0 right-0 bg-primary text-on-primary rounded-bl-xl rounded-tr-2xl px-4 py-1 font-label-caps text-label-caps tracking-wide">
          Recommended
        </span>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-5">
        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_170px] items-center gap-4 md:gap-6">
          <div>
            <div className="w-fit rounded-full border border-primary/20 bg-primary-container/15 px-3 py-1 text-xs text-primary font-label-caps">
              {flight.airline ?? "FlyAhead"}
            </div>
            <p className="font-headline-md text-headline-md leading-tight mt-3">{flight.flightNo}</p>
            <p className="text-on-surface-variant text-body-md">{flight.aircraftType}</p>
            {typeof flight.availableSeatsCount === "number" ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant seat-chip-pulse">
                <span className="material-symbols-outlined text-[14px] text-primary">event_seat</span>
                {flight.availableSeatsCount} seats left
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-center min-w-[84px]">
              <p className="font-headline-lg text-headline-lg leading-none">{formatTime(flight.departsAt)}</p>
              <p className="font-mono-data text-mono-data mt-1">{flight.origin}</p>
            </div>

            <div className="flex-1 text-center">
              <p className="font-mono-data text-mono-data text-on-surface-variant mb-1">{duration}</p>
              <div className="h-[2px] bg-outline-variant/60 relative">
                <span className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 material-symbols-outlined text-primary text-[20px] bg-surface px-1">
                  flight
                </span>
              </div>
              <p className="font-mono-data text-mono-data text-primary mt-1">
                {formatCurrency(flight.basePrice)} base
              </p>
            </div>

            <div className="text-center min-w-[84px]">
              <p className="font-headline-lg text-headline-lg leading-none">{formatTime(flight.arrivesAt)}</p>
              <p className="font-mono-data text-mono-data mt-1">{flight.destination}</p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <StatusBadge status={flight.status} className="justify-center md:justify-self-end" />
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-outline-variant/45 bg-surface-container-lowest px-2.5 py-1 text-[11px] text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("grid gap-2", availableClasses.length === 2 ? "grid-cols-2 xl:w-[260px]" : "grid-cols-3 xl:w-[360px]")}>
          {classOrder
            .filter((cabin) => availableClasses.includes(cabin))
            .map((cabin) => (
              <button
                key={cabin}
                type="button"
                onClick={() => setActiveClass(cabin)}
                className={cn(
                  "rounded-xl p-3 text-left border transition-all focus-ring",
                  activeClass === cabin
                    ? "border-primary bg-primary/10"
                    : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50"
                )}
              >
                <p className="capitalize text-on-surface-variant text-mono-data">{cabin}</p>
                <p className="font-headline-md text-headline-md">{formatCurrency(flight.classPrices[cabin])}</p>
              </button>
            ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => onSelect(flight, activeClass)}
          className="rounded-xl border border-primary text-primary px-5 py-3 font-headline-md text-headline-md hover:bg-primary hover:text-on-primary transition-colors focus-ring"
        >
          View Seats
        </button>
        <button
          type="button"
          onClick={() => onSelect(flight, activeClass)}
          className="bg-primary text-on-primary rounded-xl px-6 py-3 font-headline-md text-headline-md hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
        >
          Select Flight
        </button>
      </div>
    </article>
  );
}
