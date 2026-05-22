import Link from "next/link";
import DestinationImage from "@/components/flight/DestinationImage";
import FlightSearchForm from "@/components/flight/FlightSearchForm";
import type { SearchQuery } from "@/lib/types";

const recentSearches: Array<{ origin: SearchQuery["origin"]; destination: SearchQuery["destination"] }> = [
  { origin: "BLR", destination: "DEL" },
  { origin: "DEL", destination: "BOM" },
  { origin: "HYD", destination: "MAA" },
  { origin: "CCU", destination: "BLR" }
];

const trustChips = ["Realtime seats", "Instant PNR", "Easy reschedule", "PWA ready"];

const destinationCards = [
  { code: "DEL" as const, route: "BLR to DEL", note: "Heritage + executive corridor" },
  { code: "BOM" as const, route: "DEL to BOM", note: "High-frequency metro demand" },
  { code: "MAA" as const, route: "HYD to MAA", note: "Fast same-day turnaround" },
  { code: "GOI" as const, route: "BOM to GOI", note: "Leisure weekend favorites" }
];

const readiness = [
  { label: "Seeded Flights", value: "12+" },
  { label: "Major Routes", value: "7" },
  { label: "Seat Availability", value: "Live" },
  { label: "Offline Access", value: "PWA" }
];

export default function SearchPage() {
  return (
    <section className="max-w-[1600px] mx-auto px-gutter py-8 md:py-12 space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/35 bg-gradient-to-br from-[#0b766fdd] via-[#14b8a6ad] to-[#ecfdf5d6] shadow-glass p-6 md:p-10">
        <div className="absolute -top-14 -left-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-8 h-80 w-80 rounded-full bg-primary-container/25 blur-3xl" />

        <div className="relative z-10">
          <h1 className="font-headline-xl text-[34px] md:text-headline-xl text-on-primary-container leading-tight">
            Search Premium Flights
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container/90 mt-3 max-w-3xl">
            Balanced search controls, destination-first visuals, and reliable booking handoff for every route.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-sm float-card"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-7">
            <FlightSearchForm recentSearches={recentSearches} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <section className="glass-panel rounded-2xl p-6 shadow-glass">
          <h2 className="font-headline-lg text-headline-lg text-on-background">Popular Route Snapshots</h2>
          <p className="text-on-surface-variant mt-2">Destination visuals help users scan likely routes faster.</p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {destinationCards.map((item) => (
              <article
                key={item.route}
                className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest overflow-hidden transition-transform hover:-translate-y-1"
              >
                <DestinationImage
                  airportCode={item.code}
                  className="h-28 rounded-none"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  showLabel
                />
                <div className="p-4">
                  <p className="font-headline-md text-headline-md">{item.route}</p>
                  <p className="text-sm text-on-surface-variant mt-1">{item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 shadow-glass">
          <h2 className="font-headline-lg text-headline-lg text-on-background">Search Readiness</h2>
          <p className="text-on-surface-variant mt-2">Stable booking, ticket print, and email-ready workflows.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {readiness.map((item) => (
              <article
                key={item.label}
                className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-4 text-center transition-transform hover:-translate-y-1 animate-fade-up"
              >
                <p className="font-headline-lg text-headline-lg text-primary">{item.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{item.label}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm text-on-surface-variant">
            Need changes after booking? My Bookings supports reschedule, cancellation checks, and printable tickets.
          </p>
          <Link
            href="/my-bookings"
            className="mt-4 inline-flex items-center gap-1 rounded-xl border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            Manage My Bookings
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </section>
      </div>
    </section>
  );
}
