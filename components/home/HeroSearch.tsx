"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const trustChips = ["Realtime seats", "Secure booking", "Easy reschedule", "PWA ready"];
const popularToday = [
  "BLR -> DEL from INR 5,499",
  "DEL -> BOM from INR 6,199",
  "BOM -> GOI from INR 2,799"
];

export default function HeroSearch() {
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
    <section className="relative w-full pt-10 pb-20 md:pt-14 md:pb-24 overflow-hidden rounded-[2rem]">
      <Image
        src="/images/search-mountain.svg"
        alt="Scenic mountain and sky travel visual"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f766eb3] via-[#14b8a670] to-[#ecfdf5c9]" />
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-10 w-96 h-96 bg-primary-container/25 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-gutter relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-headline-xl text-[34px] leading-[1.14] md:text-headline-xl text-on-primary-container mb-4 max-w-3xl mx-auto">
            Book smarter. Fly smoother.
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container/85 max-w-2xl mx-auto">
            Compare live flights, lock your seat, and manage your journey end-to-end from one premium flow.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/35 bg-white/15 backdrop-blur-sm px-3 py-1 text-xs text-white float-card"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel glow-search rounded-2xl w-full shadow-glass p-card-padding border border-white/30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_1.2fr_auto] gap-4">
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
                className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-md border border-outline-variant flex items-center justify-center text-primary hover:bg-primary-container/10 transition-colors focus-ring"
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
              <label
                htmlFor="hero-depart-date"
                className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs"
              >
                Departure Date
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[20px]">calendar_month</span>
                  <input
                    id="hero-depart-date"
                    type="date"
                    value={departDate}
                    onChange={(event) => setDepartDate(event.target.value)}
                    min={todayDate}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
                    aria-label="Departure date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[20px]">event_available</span>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(event) => setReturnDate(event.target.value)}
                    min={departDate || todayDate}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
                    aria-label="Return date"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={runSearch}
              disabled={!canSearch}
              className="w-full xl:w-auto min-h-[72px] bg-primary text-on-primary font-headline-md text-headline-md px-8 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60 focus-ring"
            >
              <span className="material-symbols-outlined">search</span>
              Search Flights
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mt-6 pt-6 border-t border-outline-variant/30">
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">
                  group
                </span>
                <select
                  value={passengers}
                  onChange={(event) => setPassengers(Number(event.target.value))}
                  className="font-mono-data text-mono-data text-on-surface-variant group-hover:text-on-surface transition-colors bg-transparent border-none p-0 pr-5"
                  aria-label="Passenger count"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count} Passenger{count > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">
                  airline_seat_recline_extra
                </span>
                <select
                  value={cabinClass}
                  onChange={(event) => setCabinClass(event.target.value as CabinClass)}
                  className="font-mono-data text-mono-data text-on-surface-variant group-hover:text-on-surface transition-colors bg-transparent border-none p-0 pr-5 capitalize"
                  aria-label="Cabin class"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
              </label>
            </div>
            <Link
              href="/my-bookings"
              className="font-label-caps text-label-caps text-primary hover:underline flex items-center gap-1 focus-ring rounded-sm w-fit"
            >
              View My Bookings
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {(errors.route || errors.date) && (
            <p className="mt-3 text-sm text-error text-left">
              {errors.route}
              {errors.route && errors.date ? " " : ""}
              {errors.date}
            </p>
          )}

          <div className="mt-4 rounded-xl border border-outline-variant/35 bg-surface-container-lowest/65 px-4 py-3">
            <p className="text-xs font-label-caps text-on-surface-variant">Popular Today</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {popularToday.map((item) => (
                <span key={item} className="rounded-full bg-primary-container/15 px-3 py-1 text-xs text-primary">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
