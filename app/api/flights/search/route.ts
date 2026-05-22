import { NextResponse } from "next/server";
import { getTimeAwareFlights, normalizeFlightSearchParams } from "@/lib/flights/flight-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = {
    origin: url.searchParams.get("origin") ?? undefined,
    destination: url.searchParams.get("destination") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
    passengers: url.searchParams.get("passengers") ?? undefined,
    class: url.searchParams.get("class") ?? undefined
  };

  const normalized = normalizeFlightSearchParams(params);
  if (normalized.origin && normalized.destination && normalized.origin === normalized.destination) {
    return NextResponse.json(
      { success: false, message: "Origin and destination must be different." },
      { status: 400 }
    );
  }

  const result = await getTimeAwareFlights(params);
  return NextResponse.json(
    {
      success: true,
      source: result.source,
      reason: result.reason,
      requestedDate: result.requestedDate,
      effectiveDate: result.effectiveDate,
      dateAdjusted: result.dateAdjusted,
      data: result.flights
    },
    { status: 200 }
  );
}
