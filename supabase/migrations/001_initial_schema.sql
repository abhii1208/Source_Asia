create extension if not exists "pgcrypto";

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  flight_no text unique not null,
  airline text not null default 'FlyAhead',
  origin text not null,
  destination text not null,
  departs_at timestamptz not null,
  arrives_at timestamptz not null,
  aircraft_type text not null,
  status text not null default 'scheduled',
  base_price numeric(10,2) not null,
  created_at timestamptz default now(),
  constraint flights_status_check check (status in ('scheduled', 'boarding', 'delayed', 'departed', 'landed', 'cancelled'))
);

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references public.flights(id) on delete cascade,
  seat_number text not null,
  class text not null check (class in ('economy', 'business', 'first')),
  is_available boolean not null default true,
  extra_fee numeric(10,2) not null default 0,
  created_at timestamptz default now(),
  unique (flight_id, seat_number)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flight_id uuid not null references public.flights(id),
  seat_id uuid not null references public.seats(id),
  status text not null check (status in ('confirmed', 'rescheduled', 'cancelled')) default 'confirmed',
  booked_at timestamptz not null default now(),
  total_price numeric(10,2) not null,
  pnr_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  passport_no text not null,
  nationality text not null,
  dob date not null,
  created_at timestamptz default now()
);

create table if not exists public.reschedules (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  old_flight_id uuid not null references public.flights(id),
  new_flight_id uuid not null references public.flights(id),
  requested_at timestamptz not null default now(),
  fee_charged numeric(10,2) not null default 0
);

create index if not exists idx_flights_route_date
  on public.flights (origin, destination, departs_at);

create index if not exists idx_seats_flight_available
  on public.seats (flight_id, is_available);

create index if not exists idx_bookings_user_id
  on public.bookings (user_id);

create index if not exists idx_bookings_pnr_code
  on public.bookings (pnr_code);

create index if not exists idx_passengers_booking_id
  on public.passengers (booking_id);

create index if not exists idx_reschedules_booking_id
  on public.reschedules (booking_id);
