"use client";

import { useMemo, useState } from "react";
import AirlineBadge from "@/components/flight/AirlineBadge";
import DestinationImage from "@/components/flight/DestinationImage";
import AnimatedCard from "@/components/ui/AnimatedCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDestinationImage } from "@/lib/destination-images";
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
  const [activeClass, setActiveClass] = useState<CabinClass>(
    availableClasses.includes("economy") ? "economy" : availableClasses[0]
  );

  const duration = useMemo(() => formatDuration(flight.durationMinutes), [flight.durationMinutes]);
  const tags = flight.tags?.slice(0, 5) ?? [];
  const originMeta = getDestinationImage(flight.origin);
  const destinationMeta = getDestinationImage(flight.destination);

  return (
    <AnimatedCard>
      <article
        className={cn(
          "glass-panel rounded-2xl p-5 md:p-6 relative border border-white/40 transition-all duration-300 hover:shadow-glass",
          recommended ? "ring-2 ring-primary/65" : ""
        )}
      >
        <span className="absolute left-6 right-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        {recommended ? (
          <span className="absolute top-0 right-0 bg-primary text-on-primary rounded-bl-xl rounded-tr-2xl px-4 py-1 font-label-caps text-label-caps tracking-wide">
            Best Pick
          </span>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-5">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <AirlineBadge airline={flight.airline} />
                <p className="font-headline-md text-headline-md mt-3 leading-tight">{flight.flightNo}</p>
                <p className="text-sm text-on-surface-variant">{flight.aircraftType}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={flight.status} className="justify-center" />
                {typeof flight.availableSeatsCount === "number" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] text-primary">event_seat</span>
                    {flight.availableSeatsCount} seats
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div>
                <p className="font-headline-lg text-headline-lg leading-none">{formatTime(flight.departsAt)}</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  {originMeta.cityName} ({flight.origin})
                </p>
              </div>

              <div className="text-center min-w-[180px]">
                <p className="font-mono-data text-mono-data text-on-surface-variant">{duration}</p>
                <div className="h-[2px] bg-outline-variant/60 relative mt-1">
                  <span className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 material-symbols-outlined text-primary text-[20px] bg-surface px-1">
                    flight
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Direct</p>
              </div>

              <div className="md:text-right">
                <p className="font-headline-lg text-headline-lg leading-none">{formatTime(flight.arrivesAt)}</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  {destinationMeta.cityName} ({flight.destination})
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="space-y-3">
            <DestinationImage
              airportCode={flight.destination}
              className="h-28"
              sizes="220px"
              showLabel
            />

            <div className={cn("grid gap-2", availableClasses.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {classOrder
                .filter((cabin) => availableClasses.includes(cabin))
                .map((cabin) => (
                  <button
                    key={cabin}
                    type="button"
                    onClick={() => setActiveClass(cabin)}
                    className={cn(
                      "rounded-xl p-2.5 text-left border transition-all focus-ring",
                      activeClass === cabin
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50"
                    )}
                  >
                    <p className="capitalize text-on-surface-variant text-[11px]">{cabin}</p>
                    <p className="font-semibold text-sm">{formatCurrency(flight.classPrices[cabin])}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-4">
          <p className="text-on-surface-variant text-sm">
            Fare from <span className="font-semibold text-primary">{formatCurrency(flight.classPrices[activeClass])}</span> in {activeClass}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSelect(flight, activeClass)}
              className="rounded-xl border border-primary text-primary px-4 py-2.5 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
            >
              View Seats
            </button>
            <button
              type="button"
              onClick={() => onSelect(flight, activeClass)}
              className="bg-primary text-on-primary rounded-xl px-5 py-2.5 font-headline-md text-headline-md hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
            >
              Select Flight
            </button>
          </div>
        </div>
      </article>
    </AnimatedCard>
  );
}
