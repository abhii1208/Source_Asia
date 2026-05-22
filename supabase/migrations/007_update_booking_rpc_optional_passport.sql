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
  v_full_name text;
  v_passport_no text;
  v_nationality text;
  v_dob text;
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
    v_full_name := nullif(trim(v_passenger ->> 'full_name'), '');
    v_passport_no := nullif(trim(v_passenger ->> 'passport_no'), '');
    v_nationality := nullif(trim(v_passenger ->> 'nationality'), '');
    v_dob := nullif(trim(v_passenger ->> 'dob'), '');

    if v_full_name is null or v_nationality is null or v_dob is null then
      raise exception 'Passenger details are incomplete';
    end if;

    if v_dob !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Passenger details are incomplete';
    end if;

    insert into public.passengers (
      booking_id,
      full_name,
      passport_no,
      nationality,
      dob
    )
    values (
      v_booking_id,
      v_full_name,
      v_passport_no,
      v_nationality,
      v_dob::date
    );
  end loop;

  return v_booking_id;
end;
$$;

grant execute on function public.reserve_seat_and_create_booking(uuid, uuid, numeric, text, jsonb) to authenticated;
