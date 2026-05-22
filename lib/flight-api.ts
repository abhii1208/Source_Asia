export type FlightSearchParams = {
  from?: string;
  to?: string;
  date?: string;
};

export type CreateBookingPayload = {
  flight_id: string;
  seat_id: string;
  total_price: number;
  passengers: Array<{
    full_name: string;
    passport_no: string;
    nationality: string;
    dob: string;
  }>;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function searchFlights(params: FlightSearchParams) {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  return requestJson(`/api/flights/search?${query.toString()}`);
}

export async function createBooking(payload: CreateBookingPayload) {
  return requestJson("/api/bookings/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelBooking(bookingId: string) {
  return requestJson("/api/bookings/cancel", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId }),
  });
}

export async function rescheduleBooking(bookingId: string, newFlightId: string, newSeatId: string) {
  return requestJson("/api/bookings/reschedule", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId, new_flight_id: newFlightId, new_seat_id: newSeatId }),
  });
}

export async function getLiveStatus(flightId: string) {
  return requestJson(`/api/live-status?flightId=${encodeURIComponent(flightId)}`);
}
