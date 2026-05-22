export type AirportCode = "BLR" | "DEL" | "BOM" | "HYD" | "MAA" | "CCU" | "GOI";

export type FlightStatus = "scheduled" | "boarding" | "delayed" | "departed" | "landed" | "cancelled";

export type CabinClass = "economy" | "business" | "first";

export type BookingStatus = "confirmed" | "rescheduled" | "cancelled";

export type SeatState = "available" | "occupied";

export type SeatClass = "first" | "business" | "economy";

export type FlightDataSource = "supabase" | "fallback";

export type FlightSearchReason = "exact_match" | "nearest_date" | "popular_route" | "supabase_error";

export type Seat = {
  id: string;
  seatUuid?: string;
  row: number;
  column: string;
  cabin: SeatClass;
  state: SeatState;
  priceDelta: number;
  flight_id?: string;
  seat_number?: string;
  class?: SeatClass;
  is_available?: boolean;
  extra_fee?: number;
  created_at?: string;
};

export type SeatDefinition = Seat;

export type Flight = {
  id: string;
  flightNo: string;
  airline?: string;
  origin: AirportCode;
  destination: AirportCode;
  departsAt: string;
  arrivesAt: string;
  aircraftType: string;
  durationMinutes: number;
  status: FlightStatus;
  basePrice: number;
  classPrices: Record<CabinClass, number>;
  availableCabinClasses?: CabinClass[];
  availableSeatsCount?: number;
  tags?: string[];
  source?: FlightDataSource;
  isDemoFallback?: boolean;
  seats: Seat[];
  flight_no?: string;
  airline_name?: string;
  departs_at?: string;
  arrives_at?: string;
  aircraft_type?: string;
  base_price?: number;
  available_seats_count?: number;
  class_options?: CabinClass[];
  class_prices?: Record<CabinClass, number>;
  source_type?: FlightDataSource;
  duration?: number;
  created_at?: string;
};

export type Passenger = {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  booking_id?: string;
  full_name?: string;
  passport_no?: string | null;
  dob?: string;
  created_at?: string;
};

export type PassengerInput = {
  full_name: string;
  passport_no?: string | null;
  nationality: string;
  dob: string;
};

export type BookingCreateInput = {
  flight_id: string;
  seat_id: string;
  total_price: number;
  passengers: PassengerInput[];
};

export type Traveler = Passenger;

export type Reschedule = {
  changedAt: string;
  oldFlightNo: string;
  newFlightNo: string;
  reason: string;
  booking_id?: string;
  old_flight_id?: string;
  new_flight_id?: string;
  requested_at?: string;
  fee_charged?: number;
};

export type RescheduleLog = Reschedule;

export type Booking = {
  id: string;
  pnr: string;
  flightId: string;
  traveler: Traveler;
  cabinClass: CabinClass;
  seat: string;
  totalPrice: number;
  status: BookingStatus;
  bookedAt: string;
  rescheduleHistory: Reschedule[];
  user_id?: string;
  flight_id?: string;
  seat_id?: string;
  total_price?: number;
  pnr_code?: string;
  booked_at?: string;
  created_at?: string;
};

export type FlightSummary = {
  id: string;
  flightNo: string;
  origin: AirportCode;
  destination: AirportCode;
  departsAt: string;
  arrivesAt: string;
  aircraftType: string;
  status: FlightStatus;
  basePrice: number;
  durationMinutes: number;
};

export type SeatSummary = {
  id: string;
  seatNumber: string;
  seatClass: CabinClass;
  extraFee: number;
  isAvailable: boolean;
};

export type PassengerSummary = {
  id: string;
  fullName: string;
  passportNo?: string | null;
  nationality: string;
  dateOfBirth: string;
};

export type RescheduleRecord = {
  id: string;
  bookingId: string;
  oldFlightId: string;
  newFlightId: string;
  oldFlightNo: string;
  newFlightNo: string;
  requestedAt: string;
  feeCharged: number;
};

export type BookingWithDetails = {
  id: string;
  pnrCode: string;
  status: BookingStatus;
  bookedAt: string;
  totalPrice: number;
  flight: FlightSummary;
  seat: SeatSummary;
  passengers: PassengerSummary[];
  reschedules: RescheduleRecord[];
};

export type RescheduleOption = {
  flightId: string;
  flightNo: string;
  origin: AirportCode;
  destination: AirportCode;
  departsAt: string;
  arrivesAt: string;
  aircraftType: string;
  status: FlightStatus;
  basePrice: number;
  priceDifference: number;
};

export type CancelBookingInput = {
  booking_id: string;
};

export type RescheduleBookingInput = {
  booking_id: string;
  new_flight_id: string;
  new_seat_id: string;
};

export type RescheduleBookingResponse = {
  success: boolean;
  bookingId: string;
  feeCharged: number;
};

export type SearchQuery = {
  origin: AirportCode;
  destination: AirportCode;
  date: string;
  passengerCount: number;
  cabinClass: CabinClass;
};

export type FlightSearchMetadata = {
  source: FlightDataSource;
  reason?: FlightSearchReason;
};

export type SearchFormState = {
  origin: AirportCode;
  destination: AirportCode;
  departDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: CabinClass;
};
