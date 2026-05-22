import type { AirportCode, Booking, CabinClass, Flight, SeatClass, SeatDefinition } from "@/lib/types";

type DestinationCard = {
  city: string;
  country: string;
  fromPrice: number;
  airport: AirportCode;
  imageUrl: string;
};

const firstRows = [1, 2];
const firstColumns = ["A", "D"];
const businessRows = [3, 4, 5, 6];
const businessColumns = ["A", "B", "E", "F"];
const economyRows = Array.from({ length: 24 }, (_, idx) => idx + 7);
const economyColumns = ["A", "B", "C", "D", "E", "F"];

function resolveCabin(row: number): SeatClass {
  if (firstRows.includes(row)) {
    return "first";
  }
  if (businessRows.includes(row)) {
    return "business";
  }
  return "economy";
}

function seatPriceDelta(cabin: SeatClass): number {
  if (cabin === "first") {
    return 8500;
  }
  if (cabin === "business") {
    return 4200;
  }
  return 900;
}

function buildSeatDefinitions(occupied: string[]): SeatDefinition[] {
  const occupiedSet = new Set(occupied);
  const seats: SeatDefinition[] = [];

  firstRows.forEach((row) => {
    firstColumns.forEach((column) => {
      const seatId = `${row}${column}`;
      const cabin = resolveCabin(row);
      seats.push({
        id: seatId,
        row,
        column,
        cabin,
        state: occupiedSet.has(seatId) ? "occupied" : "available",
        priceDelta: seatPriceDelta(cabin)
      });
    });
  });

  businessRows.forEach((row) => {
    businessColumns.forEach((column) => {
      const seatId = `${row}${column}`;
      const cabin = resolveCabin(row);
      seats.push({
        id: seatId,
        row,
        column,
        cabin,
        state: occupiedSet.has(seatId) ? "occupied" : "available",
        priceDelta: seatPriceDelta(cabin)
      });
    });
  });

  economyRows.forEach((row) => {
    economyColumns.forEach((column) => {
      const seatId = `${row}${column}`;
      const cabin = resolveCabin(row);
      seats.push({
        id: seatId,
        row,
        column,
        cabin,
        state: occupiedSet.has(seatId) ? "occupied" : "available",
        priceDelta: seatPriceDelta(cabin)
      });
    });
  });

  return seats;
}

function composeIsoDate(date: string, time: string): string {
  return `${date}T${time}:00+05:30`;
}

const flightSeed: Array<
  Omit<Flight, "seats" | "classPrices"> & {
    economy: number;
    business: number;
    first: number;
    occupied: string[];
  }
> = [
  {
    id: "demo-flight-1",
    flightNo: "AM402",
    origin: "BLR",
    destination: "DEL",
    departsAt: composeIsoDate("2026-06-15", "08:00"),
    arrivesAt: composeIsoDate("2026-06-15", "10:45"),
    aircraftType: "Airbus A320neo",
    durationMinutes: 165,
    status: "boarding",
    basePrice: 6200,
    economy: 6200,
    business: 13800,
    first: 24600,
    occupied: ["1D", "5A", "5E", "6F", "12C", "13A", "20D"]
  },
  {
    id: "demo-flight-2",
    flightNo: "AM305",
    origin: "BLR",
    destination: "DEL",
    departsAt: composeIsoDate("2026-06-15", "16:20"),
    arrivesAt: composeIsoDate("2026-06-15", "19:05"),
    aircraftType: "Boeing 737 MAX 8",
    durationMinutes: 165,
    status: "scheduled",
    basePrice: 5800,
    economy: 5800,
    business: 12600,
    first: 21800,
    occupied: ["1A", "3A", "3F", "4B", "9C", "9D", "21B"]
  },
  {
    id: "demo-flight-3",
    flightNo: "AM518",
    origin: "DEL",
    destination: "BOM",
    departsAt: composeIsoDate("2026-06-16", "09:30"),
    arrivesAt: composeIsoDate("2026-06-16", "11:50"),
    aircraftType: "Airbus A321neo",
    durationMinutes: 140,
    status: "scheduled",
    basePrice: 5400,
    economy: 5400,
    business: 12100,
    first: 20600,
    occupied: ["2A", "3E", "4A", "4F", "8C", "14F"]
  },
  {
    id: "demo-flight-4",
    flightNo: "AM519",
    origin: "DEL",
    destination: "BOM",
    departsAt: composeIsoDate("2026-06-16", "20:10"),
    arrivesAt: composeIsoDate("2026-06-16", "22:25"),
    aircraftType: "Airbus A320neo",
    durationMinutes: 135,
    status: "delayed",
    basePrice: 5100,
    economy: 5100,
    business: 11800,
    first: 19900,
    occupied: ["1D", "2D", "3B", "10A", "17D"]
  },
  {
    id: "demo-flight-5",
    flightNo: "AM221",
    origin: "HYD",
    destination: "MAA",
    departsAt: composeIsoDate("2026-06-17", "07:05"),
    arrivesAt: composeIsoDate("2026-06-17", "08:20"),
    aircraftType: "ATR 72-600",
    durationMinutes: 75,
    status: "scheduled",
    basePrice: 3600,
    economy: 3600,
    business: 8600,
    first: 14500,
    occupied: ["1A", "2A", "3A", "8D", "12F"]
  },
  {
    id: "demo-flight-6",
    flightNo: "AM222",
    origin: "HYD",
    destination: "MAA",
    departsAt: composeIsoDate("2026-06-17", "19:35"),
    arrivesAt: composeIsoDate("2026-06-17", "20:50"),
    aircraftType: "Airbus A220-300",
    durationMinutes: 75,
    status: "landed",
    basePrice: 3900,
    economy: 3900,
    business: 9200,
    first: 15300,
    occupied: ["1D", "5A", "5F", "6E", "24A"]
  },
  {
    id: "demo-flight-7",
    flightNo: "AM711",
    origin: "CCU",
    destination: "BLR",
    departsAt: composeIsoDate("2026-06-18", "06:40"),
    arrivesAt: composeIsoDate("2026-06-18", "09:25"),
    aircraftType: "Boeing 787-8",
    durationMinutes: 165,
    status: "scheduled",
    basePrice: 6500,
    economy: 6500,
    business: 14500,
    first: 26500,
    occupied: ["1A", "1D", "3A", "3B", "12B", "12C", "19E"]
  },
  {
    id: "demo-flight-8",
    flightNo: "AM712",
    origin: "CCU",
    destination: "BLR",
    departsAt: composeIsoDate("2026-06-18", "14:55"),
    arrivesAt: composeIsoDate("2026-06-18", "17:40"),
    aircraftType: "Airbus A321neo",
    durationMinutes: 165,
    status: "boarding",
    basePrice: 6900,
    economy: 6900,
    business: 15200,
    first: 27200,
    occupied: ["2D", "4E", "4F", "5B", "18D", "22A", "23F"]
  }
];

export const mockFlights: Flight[] = flightSeed.map((flight) => ({
  id: flight.id,
  flightNo: flight.flightNo,
  origin: flight.origin,
  destination: flight.destination,
  departsAt: flight.departsAt,
  arrivesAt: flight.arrivesAt,
  aircraftType: flight.aircraftType,
  durationMinutes: flight.durationMinutes,
  status: flight.status,
  basePrice: flight.basePrice,
  classPrices: {
    economy: flight.economy,
    business: flight.business,
    first: flight.first
  },
  seats: buildSeatDefinitions(flight.occupied)
}));

export const trendingDestinations: DestinationCard[] = [
  {
    city: "Paris",
    country: "France",
    fromPrice: 450,
    airport: "DEL",
    imageUrl: "/images/destinations/delhi.jpg"
  },
  {
    city: "Tokyo",
    country: "Japan",
    fromPrice: 899,
    airport: "BLR",
    imageUrl: "/images/destinations/bengaluru.jpg"
  },
  {
    city: "Dubai",
    country: "UAE",
    fromPrice: 520,
    airport: "BOM",
    imageUrl: "/images/destinations/mumbai.jpg"
  }
];

const travelerA = {
  fullName: "Alex Mercer",
  passportNumber: "N7823456",
  nationality: "Indian",
  dateOfBirth: "1990-07-12"
};

const travelerB = {
  fullName: "Riya Kapoor",
  passportNumber: "L6721458",
  nationality: "Indian",
  dateOfBirth: "1995-03-08"
};

export const mockBookings: Booking[] = [
  {
    id: "demo-booking-1",
    pnr: "X89Y2Z",
    flightId: "demo-flight-1",
    traveler: travelerA,
    cabinClass: "business",
    seat: "2A",
    totalPrice: 13800,
    status: "confirmed",
    bookedAt: composeIsoDate("2026-05-20", "10:10"),
    rescheduleHistory: []
  },
  {
    id: "demo-booking-2",
    pnr: "A1B2C3",
    flightId: "demo-flight-3",
    traveler: travelerB,
    cabinClass: "economy",
    seat: "13C",
    totalPrice: 5400,
    status: "rescheduled",
    bookedAt: composeIsoDate("2026-05-19", "18:45"),
    rescheduleHistory: [
      {
        changedAt: composeIsoDate("2026-05-20", "12:20"),
        oldFlightNo: "AM517",
        newFlightNo: "AM518",
        reason: "Passenger requested earlier departure"
      }
    ]
  },
  {
    id: "demo-booking-3",
    pnr: "K4M7P9",
    flightId: "demo-flight-6",
    traveler: travelerA,
    cabinClass: "economy",
    seat: "18D",
    totalPrice: 3900,
    status: "cancelled",
    bookedAt: composeIsoDate("2026-05-18", "09:05"),
    rescheduleHistory: []
  }
];

export const indianAirports: Array<{ code: AirportCode; city: string }> = [
  { code: "BLR", city: "Bengaluru" },
  { code: "DEL", city: "Delhi" },
  { code: "BOM", city: "Mumbai" },
  { code: "HYD", city: "Hyderabad" },
  { code: "MAA", city: "Chennai" },
  { code: "CCU", city: "Kolkata" },
  { code: "GOI", city: "Goa" }
];

export const cabinClassLabels: Record<CabinClass, string> = {
  economy: "Economy",
  business: "Business",
  first: "First"
};

export function findFlightById(flightId: string): Flight | undefined {
  return mockFlights.find((flight) => flight.id === flightId);
}

export function findBookingById(bookingId: string): Booking | undefined {
  return mockBookings.find((booking) => booking.id === bookingId);
}

export function flightRouteLabel(origin: AirportCode, destination: AirportCode): string {
  return `${origin} to ${destination}`;
}
