const INDIA_OFFSET_MINUTES = 5.5 * 60;
const INDIA_OFFSET_MS = INDIA_OFFSET_MINUTES * 60 * 1000;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function parseIsoDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function withIndiaOffset(value: Date): Date {
  return new Date(value.getTime() + INDIA_OFFSET_MS);
}

function startOfIndiaDay(value: Date): Date {
  const shifted = withIndiaOffset(value);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  return new Date(Date.UTC(year, month, day) - INDIA_OFFSET_MS);
}

function toIsoDateInput(value: Date): string {
  const shifted = withIndiaOffset(value);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function normalizeSearchDate(date?: string): string {
  const parsed = date ? parseIsoDateInput(date) : null;
  if (parsed) {
    return toIsoDateInput(parsed);
  }
  return toIsoDateInput(new Date());
}

export function isPastDate(date: string): boolean {
  const parsed = parseIsoDateInput(date);
  if (!parsed) {
    return false;
  }

  const selectedDay = startOfIndiaDay(parsed);
  const today = startOfIndiaDay(new Date());
  return selectedDay.getTime() < today.getTime();
}

export function getDayRange(date: string): { start: string; end: string } {
  const safeDate = normalizeSearchDate(date);
  const parsed = parseIsoDateInput(safeDate);
  const dayStart = startOfIndiaDay(parsed ?? new Date());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: dayStart.toISOString(),
    end: dayEnd.toISOString()
  };
}

function resolveDepartureIso<T>(item: T): string | null {
  const value = item as { departs_at?: string; departsAt?: string };
  return value.departs_at ?? value.departsAt ?? null;
}

export function getNearestUpcomingFlights<T>(flights: T[]): T[] {
  const now = Date.now();
  const sorted = [...flights].sort((left, right) => {
    const leftIso = resolveDepartureIso(left);
    const rightIso = resolveDepartureIso(right);
    return new Date(leftIso ?? 0).getTime() - new Date(rightIso ?? 0).getTime();
  });

  const upcoming = sorted.filter((flight) => {
    const departsAt = resolveDepartureIso(flight);
    if (!departsAt) {
      return false;
    }
    return new Date(departsAt).getTime() >= now;
  });

  return upcoming.length > 0 ? upcoming : sorted;
}

