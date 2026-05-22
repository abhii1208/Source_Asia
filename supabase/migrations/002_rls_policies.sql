alter table public.flights enable row level security;
alter table public.seats enable row level security;
alter table public.bookings enable row level security;
alter table public.passengers enable row level security;
alter table public.reschedules enable row level security;

drop policy if exists flights_read_authenticated on public.flights;
drop policy if exists flights_read_public on public.flights;
drop policy if exists seats_read_authenticated on public.seats;
drop policy if exists seats_read_public on public.seats;
drop policy if exists bookings_select_own on public.bookings;
drop policy if exists bookings_insert_own on public.bookings;
drop policy if exists bookings_update_own on public.bookings;
drop policy if exists passengers_select_own_booking on public.passengers;
drop policy if exists passengers_insert_own_booking on public.passengers;
drop policy if exists passengers_update_own_booking on public.passengers;
drop policy if exists passengers_delete_own_booking on public.passengers;
drop policy if exists reschedules_select_own_booking on public.reschedules;
drop policy if exists reschedules_insert_own_booking on public.reschedules;
drop policy if exists reschedules_update_own_booking on public.reschedules;
drop policy if exists reschedules_delete_own_booking on public.reschedules;

create policy flights_read_public
on public.flights
for select
to anon, authenticated
using (true);

create policy seats_read_public
on public.seats
for select
to anon, authenticated
using (true);

create policy bookings_select_own
on public.bookings
for select
to authenticated
using (auth.uid() = user_id);

create policy bookings_insert_own
on public.bookings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy bookings_update_own
on public.bookings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy passengers_select_own_booking
on public.passengers
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = passengers.booking_id
      and b.user_id = auth.uid()
  )
);

create policy passengers_insert_own_booking
on public.passengers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = passengers.booking_id
      and b.user_id = auth.uid()
  )
);

create policy passengers_update_own_booking
on public.passengers
for update
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = passengers.booking_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = passengers.booking_id
      and b.user_id = auth.uid()
  )
);

create policy reschedules_select_own_booking
on public.reschedules
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = reschedules.booking_id
      and b.user_id = auth.uid()
  )
);

create policy reschedules_insert_own_booking
on public.reschedules
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = reschedules.booking_id
      and b.user_id = auth.uid()
  )
);
