-- 005_debug_checks.sql
-- Purpose:
-- 1) Ensure flight search can work publicly (anon + authenticated SELECT on flights/seats)
-- 2) Keep seats table wired for realtime publication
-- 3) Provide quick verification queries for assignment checks

alter table public.flights enable row level security;
alter table public.seats enable row level security;

alter table public.flights
add column if not exists airline text not null default 'FlyAhead';

drop policy if exists flights_read_authenticated on public.flights;
drop policy if exists flights_read_public on public.flights;
create policy flights_read_public
on public.flights
for select
to anon, authenticated
using (true);

drop policy if exists seats_read_authenticated on public.seats;
drop policy if exists seats_read_public on public.seats;
create policy seats_read_public
on public.seats
for select
to anon, authenticated
using (true);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.seats;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end $$;

-- Debug checks: run this file in Supabase SQL Editor to validate setup.
select 'flights_count' as check_name, count(*)::bigint as value
from public.flights;

select 'seats_count' as check_name, count(*)::bigint as value
from public.seats;

select origin, destination, count(*)::bigint as flights_count
from public.flights
group by origin, destination
order by origin, destination;

select
  flight_no,
  coalesce(airline, 'FlyAhead') as airline,
  origin,
  destination,
  departs_at,
  base_price
from public.flights
order by departs_at;

select
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('flights', 'seats', 'bookings', 'passengers', 'reschedules')
order by tablename, policyname;

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'reserve_seat_and_create_booking',
    'cancel_booking_atomic',
    'reschedule_booking_atomic'
  )
order by p.proname;
