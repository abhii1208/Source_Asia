import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import { createSupabaseServerClient, getSupabaseServerClientError } from "@/lib/supabase/server";
import type { CabinClass, FlightStatus } from "@/lib/types";
import { formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";

type FlightDetailProps = {
  params: {
    id: string;
  };
};

type FlightRow = {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: string;
  base_price: number | string;
};

function toFlightStatus(status: string): FlightStatus {
  if (
    status === "scheduled" ||
    status === "boarding" ||
    status === "delayed" ||
    status === "departed" ||
    status === "landed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "scheduled";
}

function toClassPrices(basePrice: number): Record<CabinClass, number> {
  return {
    economy: Math.round(basePrice),
    business: Math.round(basePrice * 2.1),
    first: Math.round(basePrice * 3.4)
  };
}

function durationMinutes(departsAt: string, arrivesAt: string): number {
  const diff = new Date(arrivesAt).getTime() - new Date(departsAt).getTime();
  if (!Number.isFinite(diff) || diff <= 0) {
    return 0;
  }
  return Math.round(diff / 60000);
}

export const dynamic = "force-dynamic";

export default async function FlightDetailPage({ params }: FlightDetailProps) {
  const envError = getSupabaseServerClientError();
  if (envError) {
    return (
      <section className="max-w-5xl mx-auto px-gutter py-10">
        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass border border-error/30">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Supabase Setup Required</h1>
          <p className="text-on-surface-variant mt-2">
            Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or
            `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in `.env.local`, then restart the app.
          </p>
        </div>
      </section>
    );
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return (
      <section className="max-w-5xl mx-auto px-gutter py-10">
        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass border border-error/30">
          <p className="text-on-surface">Supabase server client is not available.</p>
        </div>
      </section>
    );
  }

  const { data, error } = await supabase
    .from("flights")
    .select("id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price")
    .eq("id", params.id)
    .single<FlightRow>();

  if (error || !data) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Flight details query failed", {
        code: error?.code,
        message: error?.message
      });
    }
    notFound();
  }

  const basePrice = Number(data.base_price);
  const classPrices = toClassPrices(basePrice);
  const duration = durationMinutes(data.departs_at, data.arrives_at);

  return (
    <section className="max-w-5xl mx-auto px-gutter py-10">
      <article className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {data.origin} to {data.destination}
            </h1>
            <p className="text-on-surface-variant mt-1">Flight {data.flight_no}</p>
          </div>
          <StatusBadge status={toFlightStatus(data.status)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <h2 className="font-headline-md text-headline-md mb-2">Schedule</h2>
            <p className="text-on-surface-variant">Departure: {formatDateTime(data.departs_at)}</p>
            <p className="text-on-surface-variant">Arrival: {formatDateTime(data.arrives_at)}</p>
            <p className="text-on-surface-variant mt-2">Duration: {formatDuration(duration)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <h2 className="font-headline-md text-headline-md mb-2">Aircraft</h2>
            <p>{data.aircraft_type}</p>
            <p className="text-on-surface-variant mt-3">Base fare: {formatCurrency(basePrice)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <p className="text-on-surface-variant">Economy</p>
            <p className="font-headline-md text-headline-md">{formatCurrency(classPrices.economy)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <p className="text-on-surface-variant">Business</p>
            <p className="font-headline-md text-headline-md">{formatCurrency(classPrices.business)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
            <p className="text-on-surface-variant">First</p>
            <p className="font-headline-md text-headline-md">{formatCurrency(classPrices.first)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-7">
          <Link
            href={`/booking/passenger?flightId=${data.id}&cabinClass=economy`}
            className="rounded-xl bg-primary text-on-primary px-5 py-3 hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
          >
            Continue Booking
          </Link>
          <Link
            href="/flights"
            className="rounded-xl border border-primary text-primary px-5 py-3 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            Back to Results
          </Link>
        </div>
      </article>
    </section>
  );
}
