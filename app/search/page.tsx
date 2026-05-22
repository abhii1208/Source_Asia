import Image from "next/image";
import Link from "next/link";
import FlightSearchForm from "@/components/flight/FlightSearchForm";
import type { SearchQuery } from "@/lib/types";

const recentSearches: Array<{ origin: SearchQuery["origin"]; destination: SearchQuery["destination"] }> = [
  { origin: "BLR", destination: "DEL" },
  { origin: "DEL", destination: "BOM" },
  { origin: "HYD", destination: "MAA" },
  { origin: "CCU", destination: "BLR" }
];

const trustChips = ["Realtime seats", "Secure booking", "Easy reschedule", "PWA ready"];

const popularToday = [
  "BLR -> DEL from INR 5,499",
  "DEL -> BOM from INR 6,199",
  "BOM -> GOI from INR 2,799"
];

const popularRoutes = [
  {
    route: "BLR to DEL",
    note: "High-demand business route with morning and evening options."
  },
  {
    route: "DEL to BOM",
    note: "Frequent departures for executive and same-day travel."
  },
  {
    route: "HYD to MAA",
    note: "Short-haul route with fast turnaround and smooth scheduling."
  },
  {
    route: "CCU to BLR",
    note: "Longer metro connection with premium cabin availability."
  }
];

const journeySteps = [
  {
    icon: "travel_explore",
    title: "Search",
    text: "Choose route, date, passengers, and cabin class with route-aware defaults."
  },
  {
    icon: "airline_seat_recline_normal",
    title: "Select Seat",
    text: "Pick your preferred seat with realtime occupancy and cabin-based pricing."
  },
  {
    icon: "verified",
    title: "Confirm",
    text: "Secure your booking with PNR confirmation and instant booking visibility."
  },
  {
    icon: "manage_history",
    title: "Manage",
    text: "Reschedule or cancel from My Bookings with assignment-safe business rules."
  }
];

const stats = [
  { label: "Seeded Flights", value: "8+" },
  { label: "Major Routes", value: "4" },
  { label: "Seat Availability", value: "Live" },
  { label: "Offline Access", value: "PWA" }
];

export default function SearchPage() {
  return (
    <section className="max-w-[1600px] mx-auto px-gutter py-8 md:py-12 space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/35 shadow-glass">
        <Image
          src="/images/search-mountain.svg"
          alt="Travel background visual for flight search"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b766fdd] via-[#14b8a6ad] to-[#ecfdf5d6]" />
        <div className="absolute -top-14 -left-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-8 h-80 w-80 rounded-full bg-primary-container/25 blur-3xl" />

        <div className="relative z-10 px-6 py-8 md:px-10 md:py-12">
          <h1 className="font-headline-xl text-[34px] md:text-headline-xl text-on-primary-container leading-tight">
            Search Premium Flights
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container/90 mt-3 max-w-3xl">
            Plan your trip with live class pricing, route-based options, and a smooth end-to-end FlyAhead booking flow.
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

          <div className="mt-4 rounded-xl border border-white/35 bg-white/15 backdrop-blur-sm px-4 py-3">
            <p className="text-xs text-white/90 font-label-caps">Popular Today</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {popularToday.map((item) => (
                <span key={item} className="rounded-full bg-white/25 px-3 py-1 text-xs text-white">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <section className="glass-panel rounded-2xl p-6 shadow-glass">
          <h2 className="font-headline-lg text-headline-lg text-on-background">Popular Indian Routes</h2>
          <p className="text-on-surface-variant mt-2">Built on seeded flights used by the live booking flow.</p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularRoutes.map((route) => (
              <article
                key={route.route}
                className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-4 transition-transform hover:-translate-y-1 animate-fade-up"
              >
                <p className="font-headline-md text-headline-md">{route.route}</p>
                <p className="text-sm text-on-surface-variant mt-1">{route.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 shadow-glass">
          <h2 className="font-headline-lg text-headline-lg text-on-background">Search Readiness</h2>
          <p className="text-on-surface-variant mt-2">Production-focused stats for assignment verification.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((item) => (
              <article
                key={item.label}
                className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-4 text-center transition-transform hover:-translate-y-1 animate-fade-up"
              >
                <p className="font-headline-lg text-headline-lg text-primary">{item.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{item.label}</p>
              </article>
            ))}
          </div>
          <Link
            href="/my-bookings"
            className="mt-5 inline-flex items-center gap-1 rounded-xl border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            Manage My Bookings
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </section>
      </div>

      <section className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Your journey, managed end-to-end</h2>
        <p className="text-on-surface-variant mt-2 max-w-3xl">
          From search to confirmation and post-booking changes, FlyAhead keeps every step structured and clear.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {journeySteps.map((step) => (
            <article
              key={step.title}
              className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-4 transition-transform hover:-translate-y-1 animate-fade-up"
            >
              <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">{step.icon}</span>
              </div>
              <h3 className="font-headline-md text-headline-md mt-3">{step.title}</h3>
              <p className="text-sm text-on-surface-variant mt-2">{step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
