"use client";

import type { CabinClass, FlightStatus } from "@/lib/types";

export type FlightFilterState = {
  maxPrice: number;
  time: "all" | "morning" | "afternoon" | "evening";
  cabinClass: CabinClass | "all";
  status: Array<FlightStatus>;
};

type FlightFiltersProps = {
  value: FlightFilterState;
  onChange: (next: FlightFilterState) => void;
  onClear: () => void;
};

const statusList: FlightStatus[] = ["scheduled", "boarding", "delayed", "departed", "landed", "cancelled"];

export default function FlightFilters({ value, onChange, onClear }: FlightFiltersProps) {
  function toggleStatus(status: FlightStatus) {
    const selected = value.status.includes(status);
    const nextStatuses = selected ? value.status.filter((item) => item !== status) : [...value.status, status];
    onChange({ ...value, status: nextStatuses });
  }

  return (
    <aside className="glass-panel rounded-2xl p-card-padding w-full lg:max-w-[340px] shadow-glass h-fit">
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8">Filters</h2>

      <section className="mb-8">
        <h3 className="font-headline-md text-headline-md mb-4">Price</h3>
        <input
          type="range"
          min={3000}
          max={30000}
          step={100}
          value={value.maxPrice}
          onChange={(event) => onChange({ ...value, maxPrice: Number(event.target.value) })}
          className="w-full accent-primary"
          aria-label="Maximum price"
        />
        <div className="flex justify-between mt-2 text-mono-data font-mono-data text-on-surface-variant">
          <span>INR 3,000</span>
          <span>INR {value.maxPrice.toLocaleString("en-IN")}</span>
        </div>
      </section>

      <section className="mb-8 border-t border-outline-variant/30 pt-8">
        <h3 className="font-headline-md text-headline-md mb-4">Departure Time</h3>
        <select
          value={value.time}
          onChange={(event) => onChange({ ...value, time: event.target.value as FlightFilterState["time"] })}
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Any time</option>
          <option value="morning">Morning (6 AM - 12 PM)</option>
          <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
          <option value="evening">Evening (6 PM - 12 AM)</option>
        </select>
      </section>

      <section className="mb-8 border-t border-outline-variant/30 pt-8">
        <h3 className="font-headline-md text-headline-md mb-4">Class</h3>
        <select
          value={value.cabinClass}
          onChange={(event) =>
            onChange({
              ...value,
              cabinClass: event.target.value as FlightFilterState["cabinClass"]
            })
          }
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 capitalize focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All classes</option>
          <option value="economy">Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
      </section>

      <section className="border-t border-outline-variant/30 pt-8">
        <h3 className="font-headline-md text-headline-md mb-4">Status</h3>
        <div className="space-y-3">
          {statusList.map((status) => (
            <label
              key={status}
              className="flex items-center justify-between cursor-pointer rounded-lg px-1 hover:bg-surface-container-low"
            >
              <span className="capitalize text-body-md">{status}</span>
              <input
                type="checkbox"
                checked={value.status.includes(status)}
                onChange={() => toggleStatus(status)}
                className="accent-primary h-4 w-4"
              />
            </label>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onClear}
        className="w-full mt-8 border border-primary text-primary rounded-xl py-3 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
      >
        Clear All
      </button>
    </aside>
  );
}
