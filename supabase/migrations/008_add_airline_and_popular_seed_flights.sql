alter table public.flights
add column if not exists airline text not null default 'FlyAhead';

with seed_data as (
  select *
  from (
    values
      ('11111111-1111-1111-1111-111111111101'::uuid, '6E201', 'IndiGo', 'BLR', 'DEL', 2, '06:30'::time, 170, 'Airbus A320neo', 'scheduled', 5499.00),
      ('11111111-1111-1111-1111-111111111102'::uuid, 'AI274', 'Air India', 'BLR', 'DEL', 2, '18:20'::time, 175, 'Boeing 737', 'boarding', 6799.00),
      ('11111111-1111-1111-1111-111111111201'::uuid, 'AI602', 'Air India', 'DEL', 'BOM', 3, '08:10'::time, 140, 'Airbus A321', 'scheduled', 6199.00),
      ('11111111-1111-1111-1111-111111111202'::uuid, 'UK951', 'Vistara', 'DEL', 'BOM', 3, '20:00'::time, 135, 'Airbus A320', 'delayed', 6599.00),
      ('11111111-1111-1111-1111-111111111301'::uuid, 'QP881', 'Akasa Air', 'HYD', 'MAA', 4, '07:05'::time, 80, 'Boeing 737 MAX', 'scheduled', 3999.00),
      ('11111111-1111-1111-1111-111111111302'::uuid, 'SG427', 'SpiceJet', 'HYD', 'MAA', 4, '19:15'::time, 85, 'Boeing 737', 'scheduled', 4299.00),
      ('11111111-1111-1111-1111-111111111401'::uuid, '6E711', 'IndiGo', 'CCU', 'BLR', 5, '06:55'::time, 175, 'Airbus A321', 'scheduled', 7299.00),
      ('11111111-1111-1111-1111-111111111402'::uuid, 'AI901', 'Air India', 'CCU', 'BLR', 5, '15:40'::time, 170, 'Boeing 737', 'scheduled', 7599.00),
      ('11111111-1111-1111-1111-111111111501'::uuid, 'SG455', 'SpiceJet', 'BOM', 'GOI', 6, '09:20'::time, 70, 'Boeing 737', 'scheduled', 2799.00),
      ('11111111-1111-1111-1111-111111111601'::uuid, 'QP1402', 'Akasa Air', 'BLR', 'BOM', 6, '10:05'::time, 105, 'Boeing 737 MAX', 'scheduled', 3299.00),
      ('11111111-1111-1111-1111-111111111701'::uuid, 'UK877', 'Vistara', 'DEL', 'HYD', 7, '12:40'::time, 130, 'Airbus A320neo', 'scheduled', 5899.00),
      ('11111111-1111-1111-1111-111111111801'::uuid, 'AI542', 'Air India', 'MAA', 'BLR', 7, '17:45'::time, 70, 'Airbus A320', 'scheduled', 4399.00)
  ) as t(
    id,
    flight_no,
    airline,
    origin,
    destination,
    dep_day_offset,
    dep_time,
    duration_minutes,
    aircraft_type,
    status,
    base_price
  )
),
upsert_flights as (
  insert into public.flights (
    id,
    flight_no,
    airline,
    origin,
    destination,
    departs_at,
    arrives_at,
    aircraft_type,
    status,
    base_price
  )
  select
    sd.id,
    sd.flight_no,
    sd.airline,
    sd.origin,
    sd.destination,
    (((current_date + sd.dep_day_offset)::timestamp + sd.dep_time) at time zone 'Asia/Kolkata') as departs_at,
    (((current_date + sd.dep_day_offset)::timestamp + sd.dep_time + (sd.duration_minutes || ' minutes')::interval) at time zone 'Asia/Kolkata') as arrives_at,
    sd.aircraft_type,
    sd.status,
    sd.base_price
  from seed_data sd
  on conflict (id) do update set
    flight_no = excluded.flight_no,
    airline = excluded.airline,
    origin = excluded.origin,
    destination = excluded.destination,
    departs_at = excluded.departs_at,
    arrives_at = excluded.arrives_at,
    aircraft_type = excluded.aircraft_type,
    status = excluded.status,
    base_price = excluded.base_price
  returning id
),
row_template as (
  select
    row_no,
    case
      when row_no between 1 and 2 then array['A', 'D']
      when row_no between 3 and 6 then array['A', 'B', 'E', 'F']
      else array['A', 'B', 'C', 'D', 'E', 'F']
    end as seat_letters,
    case
      when row_no between 1 and 2 then 'first'
      when row_no between 3 and 6 then 'business'
      else 'economy'
    end as seat_class,
    case
      when row_no between 1 and 2 then 5000.00
      when row_no between 3 and 6 then 2500.00
      else 0.00
    end as extra_fee
  from generate_series(1, 30) as row_no
)
insert into public.seats (
  flight_id,
  seat_number,
  class,
  is_available,
  extra_fee
)
select
  f.id as flight_id,
  concat(r.row_no::text, seat_letter) as seat_number,
  r.seat_class,
  true as is_available,
  r.extra_fee
from upsert_flights f
cross join row_template r
cross join unnest(r.seat_letters) as seat_letter
on conflict (flight_id, seat_number) do update set
  class = excluded.class,
  is_available = excluded.is_available,
  extra_fee = excluded.extra_fee;

update public.seats
set is_available = false
where (flight_id, seat_number) in (
  ('11111111-1111-1111-1111-111111111101'::uuid, '1D'),
  ('11111111-1111-1111-1111-111111111102'::uuid, '3A'),
  ('11111111-1111-1111-1111-111111111201'::uuid, '2A'),
  ('11111111-1111-1111-1111-111111111202'::uuid, '5E'),
  ('11111111-1111-1111-1111-111111111301'::uuid, '9C'),
  ('11111111-1111-1111-1111-111111111302'::uuid, '4B'),
  ('11111111-1111-1111-1111-111111111401'::uuid, '15B'),
  ('11111111-1111-1111-1111-111111111402'::uuid, '2D'),
  ('11111111-1111-1111-1111-111111111501'::uuid, '7A'),
  ('11111111-1111-1111-1111-111111111601'::uuid, '10F'),
  ('11111111-1111-1111-1111-111111111701'::uuid, '6E'),
  ('11111111-1111-1111-1111-111111111801'::uuid, '18C')
);
