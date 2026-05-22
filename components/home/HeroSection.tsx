"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PopularRouteChips, { type PopularRouteChip } from "@/components/flight/PopularRouteChips";
import DestinationImage from "@/components/flight/DestinationImage";
import { indianAirports } from "@/lib/mock-data";
import type { CabinClass } from "@/lib/types";
import { getTodayDateInputValue, isTodayOrFutureDate } from "@/lib/validators";

type SearchErrors = {
  route?: string;
  date?: string;
};

function addDaysToDateInput(dateInput: string, days: number): string {
  const baseDate = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return dateInput;
  }
  baseDate.setDate(baseDate.getDate() + days);
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const trustChips = ["Realtime Seats", "Instant PNR", "Easy Reschedule", "PWA Ready"];

const quickRoutes: PopularRouteChip[] = [
  { origin: "BLR", destination: "DEL" },
  { origin: "DEL", destination: "BOM" },
  { origin: "BOM", destination: "GOI" },
  { origin: "HYD", destination: "MAA" }
];

export default function HeroSection() {
  const router = useRouter();
  const todayDate = useMemo(() => getTodayDateInputValue(), []);
  const [origin, setOrigin] = useState("BLR");
  const [destination, setDestination] = useState("DEL");
  const [departDate, setDepartDate] = useState(() => getTodayDateInputValue());
  const [returnDate, setReturnDate] = useState(() => addDaysToDateInput(getTodayDateInputValue(), 5));
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [errors, setErrors] = useState<SearchErrors>({});

  const canSearch = useMemo(() => {
    if (origin === destination) {
      return false;
    }
    if (!departDate || !isTodayOrFutureDate(departDate)) {
      return false;
    }
    if (returnDate && (!isTodayOrFutureDate(returnDate) || returnDate < departDate)) {
      return false;
    }
    return true;
  }, [origin, destination, departDate, returnDate]);

  function swapRoute() {
    setOrigin(destination);
    setDestination(origin);
  }

  function fillRoute(route: PopularRouteChip) {
    setOrigin(route.origin);
    setDestination(route.destination);
    setErrors({});
  }

  function runSearch() {
    const nextErrors: SearchErrors = {};
    if (origin === destination) {
      nextErrors.route = "Origin and destination must be different.";
    }
    if (!departDate) {
      nextErrors.date = "Please choose a departure date.";
    } else if (!isTodayOrFutureDate(departDate)) {
      nextErrors.date = "Departure date cannot be in the past.";
    } else if (returnDate && !isTodayOrFutureDate(returnDate)) {
      nextErrors.date = "Return date cannot be in the past.";
    } else if (returnDate && returnDate < departDate) {
      nextErrors.date = "Return date cannot be before departure date.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const params = new URLSearchParams({
      origin,
      destination,
      date: departDate,
      returnDate,
      passengers: String(passengers),
      class: cabinClass
    });
    router.push(`/flights?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/35 shadow-glass">
      <Image
        src="/images/search-mountain.svg"
        alt="Premium travel visual with mountains and sky tones"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f766ecc] via-[#14b8a6ab] to-[#ecfdf5d9]" />
      <div className="absolute -top-12 -left-8 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-primary-container/30 blur-3xl" />

      <div className="relative z-10 px-6 py-8 md:px-10 md:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
          <div>
            <h1 className="font-headline-xl text-[34px] leading-[1.12] md:text-headline-xl text-on-primary-container max-w-3xl">
              FlyAhead helps you search faster, book confidently, and manage every trip from one premium flow.
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary-container/90 mt-4 max-w-2xl">
              Live seats, instant PNR, print-ready tickets, and flexible reschedule options for modern travel teams.
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

            <div className="mt-7 rounded-2xl border border-white/35 bg-white/20 p-4 backdrop-blur-sm">
              <p className="text-xs font-label-caps text-white/90">Popular Route Shortcuts</p>
              <PopularRouteChips routes={quickRoutes} onSelect={fillRoute} className="mt-2" />
            </div>
          </div>

          <div className="hidden xl:grid grid-cols-2 gap-3">
            <DestinationImage airportCode="DEL" className="h-[150px]" showLabel />
            <DestinationImage airportCode="BOM" className="h-[150px]" showLabel />
            <DestinationImage airportCode="GOI" className="h-[150px]" showLabel />
            <DestinationImage airportCode="BLR" className="h-[150px]" showLabel />
          </div>
        </div>

        <div className="mt-8 glass-panel glow-search rounded-2xl w-full shadow-glass p-card-padding border border-white/35">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] gap-4">
            <div className="relative group">
              <label htmlFor="hero-origin" className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs">
                Origin
              </label>
              <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
                <span className="material-symbols-outlined text-outline mr-2">flight_takeoff</span>
                <select
                  id="hero-origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
                  aria-label="Origin airport"
                >
                  {indianAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} ({airport.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden xl:flex items-center justify-center">
              <button
                type="button"
                aria-label="Swap route"
                className="h-11 w-11 rounded-full border border-outline-variant bg-surface-container-lowest text-primary transition-colors hover:bg-primary-container/15 focus-ring"
                onClick={swapRoute}
              >
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              </button>
            </div>

            <div className="relative group">
              <label
                htmlFor="hero-destination"
                className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs"
              >
                Destination
              </label>
              <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
                <span className="material-symbols-outlined text-outline mr-2">flight_land</span>
                <select
                  id="hero-destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
                  aria-label="Destination airport"
                >
                  {indianAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} ({airport.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative group">
              <label htmlFor="hero-depart" className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs">
                Departure
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
                <span className="material-symbols-outlined text-outline text-[20px]">calendar_month</span>
                <input
                  id="hero-depart"
                  type="date"
                  value={departDate}
                  onChange={(event) => setDepartDate(event.target.value)}
                  min={todayDate}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
                  aria-label="Departure date"
                />
              </div>
            </div>

            <div className="relative group">
              <label htmlFor="hero-return" className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs">
                Return
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
                <span className="material-symbols-outlined text-outline text-[20px]">event_available</span>
                <input
                  id="hero-return"
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  min={departDate || todayDate}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
                  aria-label="Return date"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={runSearch}
              disabled={!canSearch}
              className="h-full min-h-[72px] rounded-xl bg-primary px-7 text-on-primary font-headline-md text-headline-md shadow-md transition-all hover:shadow-soft hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60 focus-ring"
            >
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined">search</span>
                Search Flights
              </span>
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-outline-variant/30 pt-5">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2">
                <span className="material-symbols-outlined text-outline text-[20px]">group</span>
                <select
                  value={passengers}
                  onChange={(event) => setPassengers(Number(event.target.value))}
                  className="bg-transparent p-0 pr-4 text-mono-data text-on-surface border-none"
                  aria-label="Passenger count"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count} Passenger{count > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2">
                <span className="material-symbols-outlined text-outline text-[20px]">airline_seat_recline_extra</span>
                <select
                  value={cabinClass}
                  onChange={(event) => setCabinClass(event.target.value as CabinClass)}
                  className="bg-transparent p-0 pr-4 text-mono-data text-on-surface border-none capitalize"
                  aria-label="Cabin class"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </label>
            </div>

            <Link href="/my-bookings" className="text-primary hover:underline text-sm focus-ring rounded-sm w-fit">
              Manage My Bookings
            </Link>
          </div>

          {(errors.route || errors.date) && (
            <p className="mt-3 rounded-xl border border-error/35 bg-error-container/70 px-3 py-2 text-sm text-on-error-container">
              {errors.route}
              {errors.route && errors.date ? " " : ""}
              {errors.date}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

