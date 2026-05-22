alter table public.passengers
alter column passport_no drop not null;

alter table public.passengers
alter column passport_no drop default;
