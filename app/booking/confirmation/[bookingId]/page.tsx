import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmationCard from "@/components/booking/ConfirmationCard";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import { isUuid } from "@/lib/booking-data";
import type { Booking, CabinClass, Flight, FlightStatus } from "@/lib/types";

type ConfirmationPageProps = {
  params: {
    bookingId: string;
  };
};

type BookingRow = {
  id: string;
  flight_id: string;
  status: string;
  booked_at: string;
  total_price: number | string;
  pnr_code: string;
  flights: FlightRow | FlightRow[] | null;
  seats: SeatRow | SeatRow[] | null;
  passengers: PassengerRow[] | null;
};

type FlightRow = {
  id: string;
  flight_no: string;
  airline?: string | null;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number | string;
};

type SeatRow = {
  id: string;
  seat_number: string;
  class: string;
  extra_fee: number | string | null;
  is_available: boolean;
};

type PassengerRow = {
  id: string;
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
};

function toCabinClass(value: string): CabinClass {
  if (value === "economy" || value === "business" || value === "first") {
    return value;
  }
  return "economy";
}

function toFlightStatus(value: string): FlightStatus {
  if (
    value === "scheduled" ||
    value === "boarding" ||
    value === "delayed" ||
    value === "departed" ||
    value === "landed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "scheduled";
}

function toDurationMinutes(departsAt: string, arrivesAt: string): number {
  const diff = new Date(arrivesAt).getTime() - new Date(departsAt).getTime();
  if (!Number.isFinite(diff) || diff <= 0) {
    return 0;
  }
  return Math.round(diff / 60000);
}

function classPrices(basePrice: number): Record<CabinClass, number> {
  return {
    economy: Math.round(basePrice),
    business: Math.round(basePrice * 2.1),
    first: Math.round(basePrice * 3.4)
  };
}

function normalizeFlight(row: FlightRow): Flight {
  const basePrice = Number(row.base_price);
  const prices = classPrices(basePrice);

  return {
    id: row.id,
    flightNo: row.flight_no,
    airline: row.airline ?? "AeroMint",
    origin: row.origin as Flight["origin"],
    destination: row.destination as Flight["destination"],
    departsAt: row.departs_at,
    arrivesAt: row.arrives_at,
    aircraftType: row.aircraft_type,
    durationMinutes: toDurationMinutes(row.departs_at, row.arrives_at),
    status: toFlightStatus(row.status),
    basePrice,
    classPrices: prices,
    availableCabinClasses: ["economy", "business", "first"],
    source: "supabase",
    seats: []
  };
}

function mapToConfirmation(row: BookingRow): { booking: Booking; flight: Flight } | null {
  const flightRow = Array.isArray(row.flights) ? (row.flights[0] ?? null) : row.flights;
  const seatRow = Array.isArray(row.seats) ? (row.seats[0] ?? null) : row.seats;
  const passenger = row.passengers?.[0] ?? null;

  if (!flightRow || !seatRow || !passenger) {
    return null;
  }

  const flight = normalizeFlight(flightRow);
  const booking: Booking = {
    id: row.id,
    pnr: row.pnr_code,
    flightId: row.flight_id,
    traveler: {
      fullName: passenger.full_name,
      passportNumber: passenger.passport_no,
      nationality: passenger.nationality,
      dateOfBirth: passenger.dob
    },
    cabinClass: toCabinClass(seatRow.class),
    seat: seatRow.seat_number,
    totalPrice: Number(row.total_price),
    status: row.status === "cancelled" ? "cancelled" : row.status === "rescheduled" ? "rescheduled" : "confirmed",
    bookedAt: row.booked_at,
    rescheduleHistory: []
  };

  return { booking, flight };
}

export default async function BookingConfirmationPage({ params }: ConfirmationPageProps) {
  const bookingId = params.bookingId ?? "";
  if (!isUuid(bookingId)) {
    return (
      <section className="max-w-3xl mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <h1 className="font-headline-md text-headline-md text-on-surface">Invalid booking reference</h1>
          <p className="text-on-surface-variant mt-2">Please open your booking again from My Bookings.</p>
          <Link href="/my-bookings" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2 text-on-primary">
            Go to My Bookings
          </Link>
        </div>
      </section>
    );
  }

  const envError = getSupabaseServerClientError();
  if (envError) {
    return (
      <section className="max-w-3xl mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <h1 className="font-headline-md text-headline-md text-on-surface">Supabase configuration missing</h1>
          <p className="text-on-surface-variant mt-2">{envError}</p>
        </div>
      </section>
    );
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return (
      <section className="max-w-3xl mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <h1 className="font-headline-md text-headline-md text-on-surface">Unable to load confirmation</h1>
          <p className="text-on-surface-variant mt-2">Supabase server client is not available.</p>
        </div>
      </section>
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/booking/confirmation/${bookingId}`);
  }

  const response = await supabase
    .from("bookings")
    .select(
      "id, flight_id, status, booked_at, total_price, pnr_code, flights:flight_id(id, flight_no, airline, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price), seats:seat_id(id, seat_number, class, extra_fee, is_available), passengers(id, full_name, passport_no, nationality, dob)"
    )
    .eq("id", bookingId)
    .single<BookingRow>();

  if (response.error || !response.data) {
    return (
      <section className="max-w-3xl mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <h1 className="font-headline-md text-headline-md text-on-surface">Booking not found</h1>
          <p className="text-on-surface-variant mt-2">
            We could not locate this booking in your account. Please check My Bookings.
          </p>
          <Link href="/my-bookings" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2 text-on-primary">
            Go to My Bookings
          </Link>
        </div>
      </section>
    );
  }

  const mapped = mapToConfirmation(response.data);
  if (!mapped) {
    return (
      <section className="max-w-3xl mx-auto px-gutter py-12">
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <h1 className="font-headline-md text-headline-md text-on-surface">Incomplete booking data</h1>
          <p className="text-on-surface-variant mt-2">
            We could not assemble full booking details. Please open the booking from My Bookings.
          </p>
          <Link href="/my-bookings" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2 text-on-primary">
            Go to My Bookings
          </Link>
        </div>
      </section>
    );
  }

  return <ConfirmationCard booking={mapped.booking} flight={mapped.flight} />;
}
