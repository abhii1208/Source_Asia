"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cabinClassLabels, indianAirports } from "@/lib/mock-data";
import type { CabinClass, SearchQuery } from "@/lib/types";
import { getTodayDateInputValue, isTodayOrFutureDate } from "@/lib/validators";
import { useFlightStore } from "@/store/useFlightStore";

type FlightSearchFormProps = {
  initialState?: Partial<SearchQuery>;
  recentSearches?: Array<{ origin: SearchQuery["origin"]; destination: SearchQuery["destination"] }>;
};

const defaults: Omit<SearchQuery, "date"> & { date?: string } = {
  origin: "BLR",
  destination: "DEL",
  passengerCount: 1,
  cabinClass: "economy"
};

export default function FlightSearchForm({ initialState, recentSearches = [] }: FlightSearchFormProps) {
  const router = useRouter();
  const setSearch = useFlightStore((state) => state.setSearch);
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery);
  const [form, setForm] = useState<SearchQuery>(() => ({
    ...defaults,
    date: getTodayDateInputValue(),
    ...initialState
  }));
  const [returnDate, setReturnDate] = useState("");
  const [error, setError] = useState("");
  const todayDate = useMemo(() => getTodayDateInputValue(), []);

  const valid = useMemo(() => {
    const hasValidRoute = form.origin !== form.destination;
    const hasValidPassengers = form.passengerCount > 0;
    const hasValidDeparture = Boolean(form.date) && isTodayOrFutureDate(form.date);
    const hasValidReturn = !returnDate || (isTodayOrFutureDate(returnDate) && returnDate >= form.date);

    return hasValidRoute && hasValidPassengers && hasValidDeparture && hasValidReturn;
  }, [form, returnDate]);

  function updateField<K extends keyof SearchQuery>(field: K, value: SearchQuery[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function runSearch() {
    if (form.origin === form.destination) {
      setError("Origin and destination must be different.");
      return;
    }

    if (!form.date) {
      setError("Please choose a departure date.");
      return;
    }

    if (!isTodayOrFutureDate(form.date)) {
      setError("Departure date cannot be in the past.");
      return;
    }

    if (returnDate && !isTodayOrFutureDate(returnDate)) {
      setError("Return date cannot be in the past.");
      return;
    }

    if (returnDate && returnDate < form.date) {
      setError("Return date cannot be before departure date.");
      return;
    }
    setError("");

    setSearch({
      origin: form.origin,
      destination: form.destination,
      departDate: form.date,
      returnDate,
      passengers: form.passengerCount,
      cabinClass: form.cabinClass
    });
    setSearchQuery(form);

    const params = new URLSearchParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      passengers: String(form.passengerCount),
      class: form.cabinClass
    });
    router.push(`/flights?${params.toString()}`);
  }

  function setChipRoute(origin: SearchQuery["origin"], destination: SearchQuery["destination"]) {
    setForm((current) => ({ ...current, origin, destination }));
  }

  return (
    <div className="glass-panel glow-search rounded-2xl w-full shadow-glass p-card-padding">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.25fr_1fr_auto] gap-4">
        <div className="relative group">
          <label htmlFor="search-origin" className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs">
            Origin
          </label>
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
            <span className="material-symbols-outlined text-outline mr-2">flight_takeoff</span>
            <select
              id="search-origin"
              value={form.origin}
              onChange={(event) => updateField("origin", event.target.value as SearchQuery["origin"])}
              className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
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
            htmlFor="search-destination"
            className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs"
          >
            Destination
          </label>
          <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
            <span className="material-symbols-outlined text-outline mr-2">flight_land</span>
            <select
              id="search-destination"
              value={form.destination}
              onChange={(event) => updateField("destination", event.target.value as SearchQuery["destination"])}
              className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
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
          <label htmlFor="search-depart" className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs">
            Departure Date
          </label>
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
            <span className="material-symbols-outlined text-outline text-[20px]">calendar_month</span>
            <input
              id="search-depart"
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              min={todayDate}
              className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
            />
          </div>
        </div>

        <div className="relative group">
          <label htmlFor="search-return" className="absolute top-2 left-4 font-label-caps text-label-caps text-outline text-xs">
            Return
          </label>
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all min-h-[72px] px-3 pt-6">
            <span className="material-symbols-outlined text-outline text-[20px]">event_available</span>
            <input
              id="search-return"
              type="date"
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
              min={form.date || todayDate}
              className="w-full bg-transparent border-none focus:ring-0 p-0 font-body-md text-on-surface"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={runSearch}
          disabled={!valid}
          className="min-h-[72px] h-full mt-auto bg-primary text-on-primary font-headline-md text-headline-md px-8 rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60 focus-ring"
        >
          <span className="material-symbols-outlined">search</span>
          Search Flights
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-outline-variant/30 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant px-3 py-2">
            <span className="material-symbols-outlined text-outline text-[20px]">group</span>
            <select
              value={form.passengerCount}
              onChange={(event) => updateField("passengerCount", Number(event.target.value))}
              className="bg-transparent border-none p-0 text-mono-data font-mono-data text-on-surface"
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count} Passenger{count > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant px-3 py-2">
            <span className="material-symbols-outlined text-outline text-[20px]">airline_seat_recline_extra</span>
            <select
              value={form.cabinClass}
              onChange={(event) => updateField("cabinClass", event.target.value as CabinClass)}
              className="bg-transparent border-none p-0 text-mono-data font-mono-data text-on-surface capitalize"
            >
              {Object.entries(cabinClassLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {recentSearches.map((item) => (
            <button
              key={`${item.origin}-${item.destination}`}
              type="button"
              onClick={() => setChipRoute(item.origin, item.destination)}
              className="rounded-full px-3 py-1 text-mono-data font-mono-data border border-outline-variant bg-surface-container-lowest hover:bg-primary-container/15 transition-colors focus-ring"
            >
              {item.origin} to {item.destination}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </div>
  );
}
