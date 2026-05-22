alter table public.flights
add column if not exists airline text not null default 'AeroMint';

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
values
  ('11111111-1111-1111-1111-111111111101', '6E201', 'IndiGo', 'BLR', 'DEL', '2026-10-15T06:30:00+05:30', '2026-10-15T09:20:00+05:30', 'Airbus A320neo', 'scheduled', 5499.00),
  ('11111111-1111-1111-1111-111111111102', 'AI274', 'Air India', 'BLR', 'DEL', '2026-10-15T18:20:00+05:30', '2026-10-15T21:15:00+05:30', 'Boeing 737', 'boarding', 6799.00),
  ('11111111-1111-1111-1111-111111111201', 'AI602', 'Air India', 'DEL', 'BOM', '2026-10-16T08:10:00+05:30', '2026-10-16T10:30:00+05:30', 'Airbus A321', 'scheduled', 6199.00),
  ('11111111-1111-1111-1111-111111111202', 'UK951', 'Vistara', 'DEL', 'BOM', '2026-10-16T20:00:00+05:30', '2026-10-16T22:15:00+05:30', 'Airbus A320', 'delayed', 6599.00),
  ('11111111-1111-1111-1111-111111111301', 'QP881', 'Akasa Air', 'HYD', 'MAA', '2026-10-17T07:05:00+05:30', '2026-10-17T08:25:00+05:30', 'Boeing 737 MAX', 'scheduled', 3999.00),
  ('11111111-1111-1111-1111-111111111302', 'SG427', 'SpiceJet', 'HYD', 'MAA', '2026-10-17T19:15:00+05:30', '2026-10-17T20:40:00+05:30', 'Boeing 737', 'scheduled', 4299.00),
  ('11111111-1111-1111-1111-111111111401', '6E711', 'IndiGo', 'CCU', 'BLR', '2026-10-18T06:55:00+05:30', '2026-10-18T09:50:00+05:30', 'Airbus A321', 'scheduled', 7299.00),
  ('11111111-1111-1111-1111-111111111402', 'AI901', 'Air India', 'CCU', 'BLR', '2026-10-18T15:40:00+05:30', '2026-10-18T18:30:00+05:30', 'Boeing 737', 'scheduled', 7599.00),
  ('11111111-1111-1111-1111-111111111501', 'SG455', 'SpiceJet', 'BOM', 'GOI', '2026-10-19T09:20:00+05:30', '2026-10-19T10:30:00+05:30', 'Boeing 737', 'scheduled', 2799.00),
  ('11111111-1111-1111-1111-111111111601', 'QP1402', 'Akasa Air', 'BLR', 'BOM', '2026-10-19T10:05:00+05:30', '2026-10-19T11:50:00+05:30', 'Boeing 737 MAX', 'scheduled', 3299.00),
  ('11111111-1111-1111-1111-111111111701', 'UK877', 'Vistara', 'DEL', 'HYD', '2026-10-20T12:40:00+05:30', '2026-10-20T14:50:00+05:30', 'Airbus A320neo', 'scheduled', 5899.00),
  ('11111111-1111-1111-1111-111111111801', 'AI542', 'Air India', 'MAA', 'BLR', '2026-10-20T17:45:00+05:30', '2026-10-20T18:55:00+05:30', 'Airbus A320', 'scheduled', 4399.00)
on conflict (id) do update set
  flight_no = excluded.flight_no,
  airline = excluded.airline,
  origin = excluded.origin,
  destination = excluded.destination,
  departs_at = excluded.departs_at,
  arrives_at = excluded.arrives_at,
  aircraft_type = excluded.aircraft_type,
  status = excluded.status,
  base_price = excluded.base_price;

with seeded_flights as (
  select id as flight_id
  from public.flights
  where id in (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111201',
    '11111111-1111-1111-1111-111111111202',
    '11111111-1111-1111-1111-111111111301',
    '11111111-1111-1111-1111-111111111302',
    '11111111-1111-1111-1111-111111111401',
    '11111111-1111-1111-1111-111111111402',
    '11111111-1111-1111-1111-111111111501',
    '11111111-1111-1111-1111-111111111601',
    '11111111-1111-1111-1111-111111111701',
    '11111111-1111-1111-1111-111111111801'
  )
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
  f.flight_id,
  concat(r.row_no::text, seat_letter) as seat_number,
  r.seat_class,
  true as is_available,
  r.extra_fee
from seeded_flights f
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
