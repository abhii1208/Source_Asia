"use client";

import { useEffect, useMemo, useState } from "react";
import type { CabinClass, Flight, SeatDefinition, SeatClass } from "@/lib/types";
import { cabinClassLabels } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

type SeatMapProps = {
  flight: Flight;
  selectedCabin: CabinClass;
  initialSeat?: string | null;
  onSeatSelect?: (seat: string | null) => void;
  onConfirm: (seat: string, totalPrice: number) => void | Promise<void>;
  confirming?: boolean;
  showDemoLabel?: boolean;
};

type RenderSeat = SeatDefinition & {
  visualState: "available" | "selected" | "occupied" | "your-seat";
};

type ZoneConfig = {
  cabin: SeatClass;
  label: string;
  rows: number[];
  layout: "first" | "business" | "economy";
};

type RowItem = { type: "seat"; seat: SeatDefinition } | { type: "aisle"; key: string };

const zones: ZoneConfig[] = [
  { cabin: "first", label: "Mint First", rows: [1, 2], layout: "first" },
  { cabin: "business", label: "Business", rows: [3, 4, 5, 6], layout: "business" },
  { cabin: "economy", label: "Economy", rows: Array.from({ length: 24 }, (_, i) => i + 7), layout: "economy" }
];

function seatClassName(state: RenderSeat["visualState"]) {
  if (state === "occupied") {
    return "bg-surface-container-high text-outline border-transparent cursor-not-allowed";
  }
  if (state === "selected") {
    return "bg-primary-container text-on-primary-container border-primary shadow-md";
  }
  if (state === "your-seat") {
    return "bg-primary text-on-primary border-primary";
  }
  return "bg-surface-container-lowest text-on-surface border-primary/30 hover:border-primary";
}

function rowColumns(layout: ZoneConfig["layout"]): string[] {
  if (layout === "first") {
    return ["A", "D"];
  }
  if (layout === "business") {
    return ["A", "B", "E", "F"];
  }
  return ["A", "B", "C", "D", "E", "F"];
}

function buildRowItems(zone: ZoneConfig, seats: SeatDefinition[], row: number): RowItem[] {
  const rowItems: RowItem[] = [];

  if (zone.layout === "first") {
    seats.forEach((seat) => rowItems.push({ type: "seat", seat }));
    return rowItems;
  }

  seats.forEach((seat, index) => {
    if ((zone.layout === "business" && index === 2) || (zone.layout === "economy" && index === 3)) {
      rowItems.push({ type: "aisle", key: `${zone.label}-${row}-aisle` });
    }
    rowItems.push({ type: "seat", seat });
  });

  return rowItems;
}

export default function SeatMap({
  flight,
  selectedCabin,
  initialSeat,
  onSeatSelect,
  onConfirm,
  confirming = false,
  showDemoLabel = false
}: SeatMapProps) {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(initialSeat ?? null);
  const [yourSeat, setYourSeat] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<SeatDefinition | null>(null);

  useEffect(() => {
    setSelectedSeat(initialSeat ?? null);
  }, [initialSeat, flight.id]);

  const seatMap = useMemo(() => new Map(flight.seats.map((seat) => [seat.id, seat])), [flight.seats]);

  const seatInfo = selectedSeat ? seatMap.get(selectedSeat) : null;
  const totalPrice = flight.classPrices[selectedCabin] + (seatInfo?.priceDelta ?? 0);

  function pickSeat(seat: SeatDefinition) {
    if (seat.state === "occupied") {
      return;
    }
    setSelectedSeat(seat.id);
    onSeatSelect?.(seat.id);
  }

  function confirmSeat() {
    if (!selectedSeat || confirming) {
      return;
    }
    setYourSeat(selectedSeat);
    void onConfirm(selectedSeat, totalPrice);
  }

  function resolveRenderSeat(seat: SeatDefinition): RenderSeat {
    if (yourSeat && seat.id === yourSeat) {
      return { ...seat, visualState: "your-seat" };
    }
    if (seat.state === "occupied") {
      return { ...seat, visualState: "occupied" };
    }
    if (selectedSeat && seat.id === selectedSeat) {
      return { ...seat, visualState: "selected" };
    }
    return { ...seat, visualState: "available" };
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-2xl p-5 md:p-8 shadow-glass">
        <div className="text-center mb-6">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Select Your Seat</h2>
          <p className="text-on-surface-variant text-body-lg mt-1">
            {flight.airline ? `${flight.airline} | ` : ""}
            {flight.aircraftType} | Flight {flight.flightNo}
          </p>
          {showDemoLabel ? (
            <p className="mt-2 inline-flex rounded-full border border-primary/35 bg-primary-container/15 px-3 py-1 text-xs text-primary">
              Demo availability shown. Live reservation uses Supabase seeded flights.
            </p>
          ) : null}
        </div>

        <div className="seat-grid scrollbar-thin overflow-x-auto pb-3 touch-pan-x">
          <div className="min-w-[820px] space-y-10">
            {zones.map((zone) => (
              <section key={zone.label}>
                <div className="relative flex items-center mb-7">
                  <div className="h-px bg-outline-variant/40 w-full" />
                  <span className="absolute left-1/2 -translate-x-1/2 rounded-full border border-outline-variant/40 bg-surface-container px-5 py-1 font-label-caps text-label-caps text-primary">
                    {zone.label}
                  </span>
                </div>

                <div className="space-y-3">
                  {zone.rows.map((row) => {
                    const columns = rowColumns(zone.layout);
                    const seats = columns.map((column) => seatMap.get(`${row}${column}`)).filter(Boolean) as SeatDefinition[];
                    const rowItems = buildRowItems(zone, seats, row);

                    return (
                      <div key={`${zone.label}-${row}`} className="grid grid-cols-[70px_1fr] items-center gap-4">
                        <span className="text-mono-data text-on-surface-variant">Row {row}</span>
                        <div
                          className={cn(
                            "grid gap-3",
                            zone.layout === "first"
                              ? "grid-cols-[repeat(2,minmax(0,68px))]"
                              : zone.layout === "business"
                                ? "grid-cols-[repeat(2,minmax(0,64px))_40px_repeat(2,minmax(0,64px))]"
                                : "grid-cols-[repeat(3,minmax(0,58px))_42px_repeat(3,minmax(0,58px))]"
                          )}
                        >
                          {rowItems.map((item) => {
                            if (item.type === "aisle") {
                              return <span key={item.key} className="h-full" aria-hidden />;
                            }

                            const seat = item.seat;
                            const renderSeat = resolveRenderSeat(seat);
                            const seatClassLabel = cabinClassLabels[seat.cabin as CabinClass];
                            const isOccupied = renderSeat.visualState === "occupied";
                            const tooltip = `${seat.id} | ${seatClassLabel} | +${formatCurrency(seat.priceDelta)}`;

                            return (
                              <div
                                key={seat.id}
                                className="h-14"
                                title={tooltip}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                              >
                                <button
                                  type="button"
                                  disabled={isOccupied}
                                  aria-disabled={isOccupied}
                                  className={cn(
                                    "h-14 w-full rounded-xl border text-body-md transition-colors focus-ring",
                                    seatClassName(renderSeat.visualState)
                                  )}
                                  aria-label={`Seat ${seat.id} ${seatClassLabel}`}
                                  onClick={() => pickSeat(seat)}
                                >
                                  {seat.id}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-4 min-h-14">
          {hoveredSeat ? (
            <p className="font-mono-data text-mono-data text-on-surface">
              Seat {hoveredSeat.id} | {cabinClassLabels[hoveredSeat.cabin as CabinClass]} | Seat surcharge{" "}
              <strong>{formatCurrency(hoveredSeat.priceDelta)}</strong>
            </p>
          ) : (
            <p className="text-on-surface-variant">
              Hover or tap any seat, including occupied seats, to preview class and surcharge.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-full bg-surface-container-lowest border border-outline-variant/30 px-7 py-4 flex flex-wrap gap-6 items-center w-fit mx-auto">
        <span className="inline-flex items-center gap-2">
          <span className="w-6 h-6 rounded-md border border-primary/30 bg-surface-container-lowest" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-6 h-6 rounded-md border border-primary bg-primary-container" />
          Selected
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary text-on-primary flex items-center justify-center text-xs">Y</span>
          Your Seat
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-surface-container-high" />
          Occupied
        </span>
      </div>

      <div className="sticky bottom-[72px] md:bottom-5 z-30 glass-panel rounded-2xl p-4 md:p-5 shadow-soft border border-white/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-on-surface-variant">Selected Seat</p>
            <p className="font-headline-md text-headline-md">{selectedSeat ?? "--"}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Base ({cabinClassLabels[selectedCabin]})</p>
            <p>{formatCurrency(flight.classPrices[selectedCabin])}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Seat Upgrade</p>
            <p>{formatCurrency(seatInfo?.priceDelta ?? 0)}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Total</p>
            <p className="font-headline-md text-headline-md text-primary">{formatCurrency(totalPrice)}</p>
          </div>
          <button
            type="button"
            disabled={!selectedSeat || confirming}
            onClick={confirmSeat}
            className="bg-primary text-on-primary rounded-xl px-6 py-3 text-headline-md font-headline-md hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-60 focus-ring"
          >
            {confirming ? "Confirming ticket..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </section>
  );
}
