import type { SeatClass, SeatDefinition } from "@/lib/types";

export type SupabaseSeatRow = {
  id: string;
  seat_number: string;
  class: string;
  is_available: boolean;
  extra_fee: number | string | null;
};

const rowLetterOrder = ["A", "B", "C", "D", "E", "F"];

function toSeatClass(value: string): SeatClass {
  if (value === "first" || value === "business" || value === "economy") {
    return value;
  }
  return "economy";
}

function parseSeatNumber(seatNumber: string): { row: number; column: string } | null {
  const match = seatNumber.match(/^(\d+)([A-Z])$/i);
  if (!match) {
    return null;
  }
  return {
    row: Number(match[1]),
    column: match[2].toUpperCase()
  };
}

function sortSeats(a: SeatDefinition, b: SeatDefinition): number {
  if (a.row !== b.row) {
    return a.row - b.row;
  }
  return rowLetterOrder.indexOf(a.column) - rowLetterOrder.indexOf(b.column);
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function mapSupabaseSeatRows(rows: SupabaseSeatRow[]): SeatDefinition[] {
  const mapped: Array<SeatDefinition | null> = rows.map((row) => {
      const parsed = parseSeatNumber(row.seat_number);
      if (!parsed) {
        return null;
      }

      const cabin = toSeatClass(row.class);
      return {
        id: row.seat_number,
        seatUuid: row.id,
        row: parsed.row,
        column: parsed.column,
        cabin,
        state: row.is_available ? "available" : "occupied",
        priceDelta: Number(row.extra_fee ?? 0),
        seat_number: row.seat_number,
        class: cabin,
        is_available: row.is_available,
        extra_fee: Number(row.extra_fee ?? 0)
      };
    });

  return mapped.filter((seat): seat is SeatDefinition => seat !== null).sort(sortSeats);
}

export function buildDemoSeatDefinitions(seedKey: string): SeatDefinition[] {
  const rows: Array<{ numbers: number[]; columns: string[]; cabin: SeatClass; surcharge: number }> = [
    { numbers: [1, 2], columns: ["A", "D"], cabin: "first", surcharge: 5200 },
    { numbers: [3, 4, 5, 6], columns: ["A", "B", "E", "F"], cabin: "business", surcharge: 2400 },
    { numbers: Array.from({ length: 24 }, (_, index) => index + 7), columns: ["A", "B", "C", "D", "E", "F"], cabin: "economy", surcharge: 0 }
  ];

  const seats: SeatDefinition[] = [];
  rows.forEach((config) => {
    config.numbers.forEach((row) => {
      config.columns.forEach((column) => {
        const seatNumber = `${row}${column}`;
        const isAvailable = hashText(`${seedKey}-${seatNumber}`) % 10 !== 0;
        seats.push({
          id: seatNumber,
          row,
          column,
          cabin: config.cabin,
          state: isAvailable ? "available" : "occupied",
          priceDelta: config.surcharge,
          seat_number: seatNumber,
          class: config.cabin,
          is_available: isAvailable,
          extra_fee: config.surcharge
        });
      });
    });
  });

  return seats.sort(sortSeats);
}
