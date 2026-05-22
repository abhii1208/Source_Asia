import Link from "next/link";
import AirlineBadge from "@/components/flight/AirlineBadge";
import DestinationImage from "@/components/flight/DestinationImage";
import AnimatedCard from "@/components/ui/AnimatedCard";
import { getDestinationImage } from "@/lib/destination-images";
import type { AirportCode } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { getTodayDateInputValue } from "@/lib/validators";

type RouteHighlight = {
  origin: AirportCode;
  destination: AirportCode;
  airline: string;
  duration: string;
  startingPrice: number;
  tag: "Popular" | "Best Value";
};

const routeHighlights: RouteHighlight[] = [
  {
    origin: "BLR",
    destination: "DEL",
    airline: "IndiGo",
    duration: "2h 50m",
    startingPrice: 5499,
    tag: "Popular"
  },
  {
    origin: "DEL",
    destination: "BOM",
    airline: "Air India",
    duration: "2h 20m",
    startingPrice: 6199,
    tag: "Best Value"
  },
  {
    origin: "HYD",
    destination: "MAA",
    airline: "Akasa Air",
    duration: "1h 20m",
    startingPrice: 3999,
    tag: "Popular"
  },
  {
    origin: "BOM",
    destination: "GOI",
    airline: "SpiceJet",
    duration: "1h 10m",
    startingPrice: 2799,
    tag: "Best Value"
  }
];

export default function PopularRoutes() {
  const date = getTodayDateInputValue();

  return (
    <section className="py-section-gap">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Popular Indian Routes</h2>
          <p className="text-on-surface-variant mt-2">
            Destination-first cards with dynamic pricing cues for faster decision making.
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-xl border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-on-primary transition-colors focus-ring w-fit"
        >
          Explore All Routes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routeHighlights.map((item, index) => {
          const destination = getDestinationImage(item.destination);
          const query = new URLSearchParams({
            origin: item.origin,
            destination: item.destination,
            date,
            passengers: "1",
            class: "economy"
          }).toString();

          return (
            <AnimatedCard key={`${item.origin}-${item.destination}`} delay={index * 0.05}>
              <article className="group overflow-hidden rounded-2xl border border-white/35 bg-white/70 shadow-glass transition-all hover:shadow-soft">
                <div className="relative h-44 overflow-hidden">
                  <DestinationImage
                    airportCode={item.destination}
                    className="h-full rounded-none transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    showLabel
                  />
                  <span className="absolute right-3 top-3 rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    {item.tag}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline-md text-headline-md text-on-background">
                        {destination.cityName}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {item.origin} to {item.destination}
                      </p>
                    </div>
                    <AirlineBadge airline={item.airline} />
                  </div>

                  <p className="mt-3 text-sm text-on-surface-variant">{destination.description}</p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Duration: {item.duration}</span>
                    <span className="font-semibold text-primary">From {formatCurrency(item.startingPrice)}</span>
                  </div>

                  <div className="mt-4 h-[2px] bg-gradient-to-r from-primary/0 via-primary/65 to-primary/0" />

                  <Link
                    href={`/flights?${query}`}
                    className="mt-4 inline-flex items-center gap-1 text-primary hover:underline focus-ring rounded-sm"
                  >
                    Search this route
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </article>
            </AnimatedCard>
          );
        })}
      </div>
    </section>
  );
}

