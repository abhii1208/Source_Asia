"use client";

import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RescheduleOption, SeatSummary } from "@/lib/types";

type RescheduleModalProps = {
  open: boolean;
  currentFlightNo: string;
  options: RescheduleOption[];
  seatOptions: SeatSummary[];
  selectedFlightId: string | null;
  selectedSeatId: string | null;
  feeCharged: number;
  loadingOptions: boolean;
  loadingSeats: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSelectFlight: (flightId: string) => void;
  onSelectSeat: (seatId: string) => void;
  onConfirm: () => void;
};

function toClassLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function RescheduleModal({
  open,
  currentFlightNo,
  options,
  seatOptions,
  selectedFlightId,
  selectedSeatId,
  feeCharged,
  loadingOptions,
  loadingSeats,
  submitting,
  error,
  onClose,
  onSelectFlight,
  onSelectSeat,
  onConfirm
}: RescheduleModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm px-4 py-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto glass-panel rounded-2xl p-6 shadow-glass border border-white/45">
        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Reschedule Flight</h3>
        <p className="text-on-surface-variant mb-6">Current flight: {currentFlightNo}. Choose a new flight and seat.</p>

        {error ? (
          <p className="mb-4 rounded-xl border border-error/40 bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section className="space-y-3">
            <h4 className="font-headline-md text-headline-md text-on-surface">1. Choose Alternative Flight</h4>
            <div className="space-y-3 max-h-[340px] overflow-y-auto">
              {loadingOptions ? (
                <p className="text-on-surface-variant text-sm">Loading flights...</p>
              ) : options.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No alternative flights available right now.</p>
              ) : (
                options.map((flight) => (
                  <label
                    key={flight.flightId}
                    className="flex gap-3 items-start rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 cursor-pointer hover:border-primary/60 transition-colors"
                  >
                    <input
                      type="radio"
                      name="reschedule-flight"
                      value={flight.flightId}
                      checked={selectedFlightId === flight.flightId}
                      onChange={(event) => onSelectFlight(event.target.value)}
                      className="mt-1 accent-primary"
                      disabled={submitting}
                    />
                    <div className="space-y-1">
                      <p className="font-headline-md text-headline-md">{flight.flightNo}</p>
                      <p className="text-on-surface-variant text-sm">
                        {flight.origin} to {flight.destination}
                      </p>
                      <p className="text-on-surface-variant text-sm">{formatDateTime(flight.departsAt)}</p>
                      <p className="text-on-surface-variant text-sm">{flight.aircraftType}</p>
                      <p className="text-primary text-sm font-medium">
                        Base Price: {formatCurrency(flight.basePrice)} | Difference: {formatCurrency(flight.priceDifference)}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="font-headline-md text-headline-md text-on-surface">2. Choose Seat</h4>
            <div className="space-y-3 max-h-[340px] overflow-y-auto">
              {selectedFlightId ? (
                loadingSeats ? (
                  <p className="text-on-surface-variant text-sm">Loading seats...</p>
                ) : seatOptions.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No available seats found for this flight.</p>
                ) : (
                  seatOptions.map((seat) => (
                    <label
                      key={seat.id}
                      className="flex gap-3 items-center rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 cursor-pointer hover:border-primary/60 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reschedule-seat"
                        value={seat.id}
                        checked={selectedSeatId === seat.id}
                        onChange={(event) => onSelectSeat(event.target.value)}
                        className="accent-primary"
                        disabled={submitting}
                      />
                      <div className="flex-1 grid grid-cols-2 gap-2 text-sm text-on-surface-variant">
                        <p className="font-medium text-on-surface">Seat {seat.seatNumber}</p>
                        <p className="text-right">{toClassLabel(seat.seatClass)}</p>
                        <p>Extra Fee</p>
                        <p className="text-right text-primary">{formatCurrency(seat.extraFee)}</p>
                      </div>
                    </label>
                  ))
                )
              ) : (
                <p className="text-on-surface-variant text-sm">Select a flight to view available seats.</p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
          <p className="text-on-surface-variant text-sm">Estimated Reschedule Fee</p>
          <p className="font-headline-md text-headline-md text-primary mt-1">{formatCurrency(feeCharged)}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-outline text-on-surface px-4 py-3 hover:bg-surface-container-low transition-colors focus-ring disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!selectedFlightId || !selectedSeatId || submitting}
            onClick={onConfirm}
            className="rounded-xl bg-primary text-on-primary px-5 py-3 hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-60 focus-ring"
          >
            {submitting ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
