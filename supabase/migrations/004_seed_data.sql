insert into public.flights (
  id,
  flight_no,
  origin,
  destination,
  departs_at,
  arrives_at,
  aircraft_type,
  status,
  base_price
)
values
  ('11111111-1111-1111-1111-111111111101', 'AM101', 'BLR', 'DEL', '2026-10-15T07:40:00+05:30', '2026-10-15T10:25:00+05:30', 'Airbus A320', 'scheduled', 6200.00),
  ('11111111-1111-1111-1111-111111111102', 'AM102', 'BLR', 'DEL', '2026-10-15T18:05:00+05:30', '2026-10-15T20:50:00+05:30', 'Boeing 737', 'boarding', 6600.00),
  ('11111111-1111-1111-1111-111111111201', 'AM201', 'DEL', 'BOM', '2026-10-16T08:20:00+05:30', '2026-10-16T10:35:00+05:30', 'Airbus A321', 'scheduled', 4500.00),
  ('11111111-1111-1111-1111-111111111202', 'AM202', 'DEL', 'BOM', '2026-10-16T20:10:00+05:30', '2026-10-16T22:20:00+05:30', 'Airbus A320', 'delayed', 5200.00),
  ('11111111-1111-1111-1111-111111111301', 'AM301', 'HYD', 'MAA', '2026-10-17T06:50:00+05:30', '2026-10-17T08:05:00+05:30', 'Boeing 737', 'scheduled', 4800.00),
  ('11111111-1111-1111-1111-111111111302', 'AM302', 'HYD', 'MAA', '2026-10-17T19:25:00+05:30', '2026-10-17T20:40:00+05:30', 'Airbus A320', 'boarding', 5100.00),
  ('11111111-1111-1111-1111-111111111401', 'AM401', 'CCU', 'BLR', '2026-10-18T07:15:00+05:30', '2026-10-18T10:05:00+05:30', 'Airbus A321', 'scheduled', 7800.00),
  ('11111111-1111-1111-1111-111111111402', 'AM402', 'CCU', 'BLR', '2026-10-18T15:10:00+05:30', '2026-10-18T18:00:00+05:30', 'Boeing 737', 'delayed', 7400.00)
on conflict (id) do update set
  flight_no = excluded.flight_no,
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
    '11111111-1111-1111-1111-111111111402'
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
  ('11111111-1111-1111-1111-111111111101'::uuid, '12C'),
  ('11111111-1111-1111-1111-111111111102'::uuid, '3A'),
  ('11111111-1111-1111-1111-111111111102'::uuid, '22F'),
  ('11111111-1111-1111-1111-111111111201'::uuid, '2A'),
  ('11111111-1111-1111-1111-111111111201'::uuid, '18D'),
  ('11111111-1111-1111-1111-111111111202'::uuid, '5E'),
  ('11111111-1111-1111-1111-111111111202'::uuid, '14A'),
  ('11111111-1111-1111-1111-111111111301'::uuid, '1A'),
  ('11111111-1111-1111-1111-111111111301'::uuid, '9C'),
  ('11111111-1111-1111-1111-111111111302'::uuid, '4B'),
  ('11111111-1111-1111-1111-111111111302'::uuid, '26E'),
  ('11111111-1111-1111-1111-111111111401'::uuid, '6F'),
  ('11111111-1111-1111-1111-111111111401'::uuid, '15B'),
  ('11111111-1111-1111-1111-111111111402'::uuid, '2D'),
  ('11111111-1111-1111-1111-111111111402'::uuid, '27A')
);
