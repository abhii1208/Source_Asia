import type { AirportCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PopularRouteChip = {
  origin: AirportCode;
  destination: AirportCode;
};

type PopularRouteChipsProps = {
  routes: PopularRouteChip[];
  onSelect: (route: PopularRouteChip) => void;
  className?: string;
};

export default function PopularRouteChips({ routes, onSelect, className }: PopularRouteChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {routes.map((route) => (
        <button
          key={`${route.origin}-${route.destination}`}
          type="button"
          onClick={() => onSelect(route)}
          className="rounded-full border border-outline-variant/45 bg-surface-container-lowest px-3 py-1 text-xs text-on-surface-variant transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary focus-ring"
        >
          {route.origin} to {route.destination}
        </button>
      ))}
    </div>
  );
}

