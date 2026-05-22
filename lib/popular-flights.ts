import type {
  AirportCode,
  CabinClass,
  Flight,
  FlightStatus,
  SearchQuery,
  SeatClass,
  SeatDefinition
} from "@/lib/types";

type PopularFlightSeed = {
  id: string;
  flightNo: string;
  airline: string;
  origin: AirportCode;
  destination: AirportCode;
  departureTime: string;
  durationMinutes: number;
  aircraftType: string;
  status: FlightStatus;
  basePrice: number;
  supportsFirst: boolean;
  baseTags: string[];
};

export type PopularFlightSearchInput = Partial<Pick<SearchQuery, "origin" | "destination" | "date" | "cabinClass">>;

const INDIA_OFFSET_MINUTES = 5.5 * 60;
const INDIA_OFFSET_MS = INDIA_OFFSET_MINUTES * 60 * 1000;

const popularFlightSeeds: PopularFlightSeed[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    flightNo: "6E201",
    airline: "IndiGo",
    origin: "BLR",
    destination: "DEL",
    departureTime: "06:30",
    durationMinutes: 170,
    aircraftType: "Airbus A320neo",
    status: "scheduled",
    basePrice: 5499,
    supportsFirst: false,
    baseTags: ["Cheapest", "Morning flight", "Popular"]
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    flightNo: "AI274",
    airline: "Air India",
    origin: "BLR",
    destination: "DEL",
    departureTime: "18:20",
    durationMinutes: 175,
    aircraftType: "Boeing 737",
    status: "boarding",
    basePrice: 6799,
    supportsFirst: true,
    baseTags: ["Premium", "Popular"]
  },
  {
    id: "11111111-1111-1111-1111-111111111201",
    flightNo: "AI602",
    airline: "Air India",
    origin: "DEL",
    destination: "BOM",
    departureTime: "08:10",
    durationMinutes: 140,
    aircraftType: "Airbus A321",
    status: "scheduled",
    basePrice: 6199,
    supportsFirst: true,
    baseTags: ["Popular", "Best value"]
  },
  {
    id: "11111111-1111-1111-1111-111111111202",
    flightNo: "UK951",
    airline: "Vistara",
    origin: "DEL",
    destination: "BOM",
    departureTime: "20:00",
    durationMinutes: 135,
    aircraftType: "Airbus A320",
    status: "delayed",
    basePrice: 6599,
    supportsFirst: true,
    baseTags: ["Premium", "Fastest"]
  },
  {
    id: "11111111-1111-1111-1111-111111111301",
    flightNo: "QP881",
    airline: "Akasa Air",
    origin: "HYD",
    destination: "MAA",
    departureTime: "07:05",
    durationMinutes: 80,
    aircraftType: "Boeing 737 MAX",
    status: "scheduled",
    basePrice: 3999,
    supportsFirst: false,
    baseTags: ["Morning flight", "Popular"]
  },
  {
    id: "11111111-1111-1111-1111-111111111302",
    flightNo: "SG427",
    airline: "SpiceJet",
    origin: "HYD",
    destination: "MAA",
    departureTime: "19:15",
    durationMinutes: 85,
    aircraftType: "Boeing 737",
    status: "scheduled",
    basePrice: 4299,
    supportsFirst: false,
    baseTags: ["Best value"]
  },
  {
    id: "11111111-1111-1111-1111-111111111401",
    flightNo: "6E711",
    airline: "IndiGo",
    origin: "CCU",
    destination: "BLR",
    departureTime: "06:55",
    durationMinutes: 175,
    aircraftType: "Airbus A321",
    status: "scheduled",
    basePrice: 7299,
    supportsFirst: false,
    baseTags: ["Morning flight", "Popular"]
  },
  {
    id: "11111111-1111-1111-1111-111111111402",
    flightNo: "AI901",
    airline: "Air India",
    origin: "CCU",
    destination: "BLR",
    departureTime: "15:40",
    durationMinutes: 170,
    aircraftType: "Boeing 737",
    status: "scheduled",
    basePrice: 7599,
    supportsFirst: true,
    baseTags: ["Premium"]
  },
  {
    id: "11111111-1111-1111-1111-111111111501",
    flightNo: "SG455",
    airline: "SpiceJet",
    origin: "BOM",
    destination: "GOI",
    departureTime: "09:20",
    durationMinutes: 70,
    aircraftType: "Boeing 737",
    status: "scheduled",
    basePrice: 2799,
    supportsFirst: false,
    baseTags: ["Cheapest", "Popular"]
  },
  {
    id: "11111111-1111-1111-1111-111111111601",
    flightNo: "QP1402",
    airline: "Akasa Air",
    origin: "BLR",
    destination: "BOM",
    departureTime: "10:05",
    durationMinutes: 105,
    aircraftType: "Boeing 737 MAX",
    status: "scheduled",
    basePrice: 3299,
    supportsFirst: false,
    baseTags: ["Cheapest", "Best value"]
  },
  {
    id: "11111111-1111-1111-1111-111111111701",
    flightNo: "UK877",
    airline: "Vistara",
    origin: "DEL",
    destination: "HYD",
    departureTime: "12:40",
    durationMinutes: 130,
    aircraftType: "Airbus A320neo",
    status: "scheduled",
    basePrice: 5899,
    supportsFirst: true,
    baseTags: ["Premium", "Popular"]
  },
  {
    id: "11111111-1111-1111-1111-111111111801",
    flightNo: "AI542",
    airline: "Air India",
    origin: "MAA",
    destination: "BLR",
    departureTime: "17:45",
    durationMinutes: 70,
    aircraftType: "Airbus A320",
    status: "scheduled",
    basePrice: 4399,
    supportsFirst: false,
    baseTags: ["Evening flight", "Best value"]
  }
];

function parseIsoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

function parseTime(value: string): { hours: number; minutes: number } {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0
  };
}

function withIndiaOffset(date: Date): Date {
  return new Date(date.getTime() + INDIA_OFFSET_MS);
}

function startOfIndiaDay(date: Date): Date {
  const inIndia = withIndiaOffset(date);
  const year = inIndia.getUTCFullYear();
  const month = inIndia.getUTCMonth();
  const day = inIndia.getUTCDate();
  return new Date(Date.UTC(year, month, day) - INDIA_OFFSET_MS);
}

function createIndiaDate(baseDayUtc: Date, time: string): Date {
  const inIndia = withIndiaOffset(baseDayUtc);
  const year = inIndia.getUTCFullYear();
  const month = inIndia.getUTCMonth();
  const day = inIndia.getUTCDate();
  const { hours, minutes } = parseTime(time);
  return new Date(Date.UTC(year, month, day, hours, minutes) - INDIA_OFFSET_MS);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildSeatTemplate(flightId: string): { seats: SeatDefinition[]; availableSeatsCount: number } {
  const seats: SeatDefinition[] = [];
  const firstRows = [1, 2];
  const businessRows = [3, 4, 5, 6];
  const economyRows = Array.from({ length: 24 }, (_, index) => index + 7);

  const rowConfigs: Array<{ rows: number[]; columns: string[]; cabin: SeatClass; surcharge: number }> = [
    { rows: firstRows, columns: ["A", "D"], cabin: "first", surcharge: 5200 },
    { rows: businessRows, columns: ["A", "B", "E", "F"], cabin: "business", surcharge: 2400 },
    { rows: economyRows, columns: ["A", "B", "C", "D", "E", "F"], cabin: "economy", surcharge: 0 }
  ];

  rowConfigs.forEach((config) => {
    config.rows.forEach((row) => {
      config.columns.forEach((column) => {
        const id = `${row}${column}`;
        const occupied = hashText(`${flightId}-${id}`) % 11 === 0;
        seats.push({
          id,
          row,
          column,
          cabin: config.cabin,
          state: occupied ? "occupied" : "available",
          priceDelta: config.surcharge
        });
      });
    });
  });

  return {
    seats,
    availableSeatsCount: seats.filter((seat) => seat.state === "available").length
  };
}

function buildClassPrices(basePrice: number, supportsFirst: boolean): Record<CabinClass, number> {
  return {
    economy: Math.round(basePrice),
    business: Math.round(basePrice * 1.85),
    first: supportsFirst ? Math.round(basePrice * 2.7) : Math.round(basePrice * 2.1)
  };
}

function resolveBaseDay(inputDate: string | undefined): Date {
  const now = new Date();
  const explicitDate = parseIsoDate(inputDate);
  const defaultBase = startOfIndiaDay(now);

  if (explicitDate) {
    const day = startOfIndiaDay(explicitDate);
    if (day.getTime() < defaultBase.getTime()) {
      return defaultBase;
    }
    return day;
  }

  const indiaNow = withIndiaOffset(now);
  const hour = indiaNow.getUTCHours();
  if (hour >= 18) {
    return addDays(defaultBase, 1);
  }
  return defaultBase;
}

function addTimeTags(date: Date, tags: string[]): string[] {
  const hour = withIndiaOffset(date).getUTCHours();
  if (hour >= 5 && hour < 12) {
    return [...new Set([...tags, "Morning flight"])];
  }
  if (hour >= 12 && hour < 17) {
    return [...new Set([...tags, "Best value"])];
  }
  return [...new Set([...tags, "Evening flight"])];
}

function mapSeedToFlight(seed: PopularFlightSeed, baseDay: Date, explicitDate: string | undefined): Flight {
  const now = new Date();
  let departure = createIndiaDate(baseDay, seed.departureTime);

  if (!explicitDate) {
    while (departure.getTime() <= now.getTime()) {
      departure = addDays(departure, 1);
    }
  } else if (departure.getTime() <= now.getTime()) {
    departure = addDays(departure, 1);
  }

  const arrival = new Date(departure.getTime() + seed.durationMinutes * 60000);
  const { seats, availableSeatsCount } = buildSeatTemplate(seed.id);
  const classPrices = buildClassPrices(seed.basePrice, seed.supportsFirst);
  const availableCabinClasses: CabinClass[] = seed.supportsFirst
    ? ["economy", "business", "first"]
    : ["economy", "business"];
  const tags = addTimeTags(departure, seed.baseTags);

  return {
    id: seed.id,
    flightNo: seed.flightNo,
    airline: seed.airline,
    origin: seed.origin,
    destination: seed.destination,
    departsAt: departure.toISOString(),
    arrivesAt: arrival.toISOString(),
    aircraftType: seed.aircraftType,
    durationMinutes: seed.durationMinutes,
    status: seed.status,
    basePrice: seed.basePrice,
    classPrices,
    availableCabinClasses,
    availableSeatsCount,
    tags,
    source: "fallback",
    isDemoFallback: true,
    seats,
    flight_no: seed.flightNo,
    airline_name: seed.airline,
    departs_at: departure.toISOString(),
    arrives_at: arrival.toISOString(),
    aircraft_type: seed.aircraftType,
    base_price: seed.basePrice,
    available_seats_count: availableSeatsCount,
    class_options: availableCabinClasses,
    class_prices: classPrices,
    source_type: "fallback",
    duration: seed.durationMinutes
  };
}

function matchesRoute(flight: PopularFlightSeed, origin?: AirportCode, destination?: AirportCode): boolean {
  if (origin && flight.origin !== origin) {
    return false;
  }
  if (destination && flight.destination !== destination) {
    return false;
  }
  return true;
}

export function getPopularFlightSeeds(): PopularFlightSeed[] {
  return popularFlightSeeds;
}

export function buildPopularFlights(input: PopularFlightSearchInput): Flight[] {
  const baseDay = resolveBaseDay(input.date);
  const seededFlights = popularFlightSeeds
    .filter((flight) => matchesRoute(flight, input.origin, input.destination))
    .map((seed) => mapSeedToFlight(seed, baseDay, input.date))
    .sort((a, b) => new Date(a.departsAt).getTime() - new Date(b.departsAt).getTime());

  if (seededFlights.length > 0) {
    return seededFlights;
  }

  return popularFlightSeeds
    .map((seed) => mapSeedToFlight(seed, baseDay, input.date))
    .sort((a, b) => new Date(a.departsAt).getTime() - new Date(b.departsAt).getTime())
    .slice(0, 8);
}
