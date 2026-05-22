create or replace function public.enforce_cancellation_window()
returns trigger
language plpgsql
as $$
declare
  v_departs_at timestamptz;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    select f.departs_at
    into v_departs_at
    from public.flights f
    where f.id = old.flight_id;

    if v_departs_at is null then
      raise exception 'Unable to locate flight for booking cancellation check';
    end if;

    if v_departs_at <= now() + interval '2 hours' then
      raise exception 'Cancellation is blocked within 2 hours of departure';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_cancel_window on public.bookings;

create trigger trg_bookings_cancel_window
before update on public.bookings
for each row
execute function public.enforce_cancellation_window();

create or replace function public.reserve_seat_and_create_booking(
  p_flight_id uuid,
  p_seat_id uuid,
  p_total_price numeric,
  p_pnr_code text,
  p_passengers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_booking_id uuid;
  v_seat public.seats%rowtype;
  v_passenger jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_total_price is null or p_total_price <= 0 then
    raise exception 'Invalid total price';
  end if;

  if p_passengers is null
     or jsonb_typeof(p_passengers) <> 'array'
     or jsonb_array_length(p_passengers) = 0 then
    raise exception 'Passenger list must be a non-empty JSON array';
  end if;

  select s.*
  into v_seat
  from public.seats s
  where s.id = p_seat_id
  for update;

  if not found then
    raise exception 'Seat not found';
  end if;

  if v_seat.flight_id <> p_flight_id then
    raise exception 'Seat does not belong to the selected flight';
  end if;

  if not v_seat.is_available then
    raise exception 'Seat is no longer available';
  end if;

  update public.seats
  set is_available = false
  where id = p_seat_id;

  insert into public.bookings (
    user_id,
    flight_id,
    seat_id,
    status,
    total_price,
    pnr_code
  )
  values (
    v_user_id,
    p_flight_id,
    p_seat_id,
    'confirmed',
    p_total_price,
    p_pnr_code
  )
  returning id into v_booking_id;

  for v_passenger in
    select value
    from jsonb_array_elements(p_passengers)
  loop
    insert into public.passengers (
      booking_id,
      full_name,
      passport_no,
      nationality,
      dob
    )
    values (
      v_booking_id,
      nullif(trim(v_passenger ->> 'full_name'), ''),
      nullif(trim(v_passenger ->> 'passport_no'), ''),
      nullif(trim(v_passenger ->> 'nationality'), ''),
      (v_passenger ->> 'dob')::date
    );
  end loop;

  return v_booking_id;
end;
$$;

create or replace function public.cancel_booking_atomic(
  p_booking_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_booking public.bookings%rowtype;
  v_departs_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select b.*
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.user_id <> v_user_id then
    raise exception 'You are not allowed to cancel this booking';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'Booking is already cancelled';
  end if;

  select f.departs_at
  into v_departs_at
  from public.flights f
  where f.id = v_booking.flight_id;

  if v_departs_at <= now() + interval '2 hours' then
    raise exception 'Cancellation is blocked within 2 hours of departure';
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = v_booking.id;

  update public.seats
  set is_available = true
  where id = v_booking.seat_id;

  return true;
end;
$$;

create or replace function public.reschedule_booking_atomic(
  p_booking_id uuid,
  p_new_flight_id uuid,
  p_new_seat_id uuid,
  p_fee_charged numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_booking public.bookings%rowtype;
  v_old_flight public.flights%rowtype;
  v_new_flight public.flights%rowtype;
  v_old_seat public.seats%rowtype;
  v_new_seat public.seats%rowtype;
  v_fee numeric := coalesce(p_fee_charged, 0);
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_fee < 0 then
    raise exception 'Reschedule fee cannot be negative';
  end if;

  select b.*
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.user_id <> v_user_id then
    raise exception 'You are not allowed to reschedule this booking';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'Cancelled bookings cannot be rescheduled';
  end if;

  select f.*
  into v_old_flight
  from public.flights f
  where f.id = v_booking.flight_id;

  select f.*
  into v_new_flight
  from public.flights f
  where f.id = p_new_flight_id;

  if v_new_flight.id is null then
    raise exception 'New flight not found';
  end if;

  if v_old_flight.origin <> v_new_flight.origin
     or v_old_flight.destination <> v_new_flight.destination then
    raise exception 'New flight must have the same origin and destination as the original booking';
  end if;

  select s.*
  into v_old_seat
  from public.seats s
  where s.id = v_booking.seat_id
  for update;

  select s.*
  into v_new_seat
  from public.seats s
  where s.id = p_new_seat_id
  for update;

  if not found then
    raise exception 'New seat not found';
  end if;

  if v_new_seat.flight_id <> p_new_flight_id then
    raise exception 'New seat does not belong to the requested new flight';
  end if;

  if not v_new_seat.is_available then
    raise exception 'New seat is not available';
  end if;

  update public.seats
  set is_available = true
  where id = v_old_seat.id;

  update public.seats
  set is_available = false
  where id = v_new_seat.id;

  insert into public.reschedules (
    booking_id,
    old_flight_id,
    new_flight_id,
    fee_charged
  )
  values (
    v_booking.id,
    v_booking.flight_id,
    p_new_flight_id,
    v_fee
  );

  update public.bookings
  set flight_id = p_new_flight_id,
      seat_id = p_new_seat_id,
      total_price = v_booking.total_price + v_fee,
      status = 'rescheduled'
  where id = v_booking.id;

  return v_booking.id;
end;
$$;

grant execute on function public.reserve_seat_and_create_booking(uuid, uuid, numeric, text, jsonb) to authenticated;
grant execute on function public.cancel_booking_atomic(uuid) to authenticated;
grant execute on function public.reschedule_booking_atomic(uuid, uuid, uuid, numeric) to authenticated;
