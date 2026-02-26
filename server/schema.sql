-- Simple scheduling schema (non-HIPAA)

create table if not exists services (
  id bigserial primary key,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Weekly recurring availability (0=Sunday ... 6=Saturday)
create table if not exists availability (
  id bigserial primary key,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_length_minutes integer not null check (slot_length_minutes > 0),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- Date-specific overrides (closed or custom hours)
create table if not exists exceptions (
  id bigserial primary key,
  exception_date date not null unique,
  is_closed boolean not null default true,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  check (
    (is_closed = true and start_time is null and end_time is null) or
    (is_closed = false and start_time is not null and end_time is not null and end_time > start_time)
  )
);

create table if not exists appointments (
  id bigserial primary key,
  service_id bigint references services(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  first_name text not null,
  last_name text,
  contact_email text,
  contact_phone text,
  notes text,
  status text not null default 'booked',
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check ((contact_email is not null) or (contact_phone is not null))
);

do $$
begin
  -- One-time cleanup for local DBs that previously used last_initial.
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'last_name'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'last_initial'
  ) then
    alter table appointments rename column last_initial to last_name;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'last_name'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'last_initial'
  ) then
    update appointments
    set last_name = coalesce(last_name, last_initial);

    alter table appointments drop column last_initial;
  end if;
end
$$;

create table if not exists blocked_periods (
  id bigserial primary key,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- Normalize and dedupe services before enforcing uniqueness.
update services
set name = trim(name)
where name <> trim(name);

with ranked_services as (
  select
    id,
    row_number() over (partition by name order by id) as rn,
    min(id) over (partition by name) as keep_id
  from services
),
duplicate_services as (
  select id, keep_id
  from ranked_services
  where rn > 1
)
update appointments a
set service_id = d.keep_id
from duplicate_services d
where a.service_id = d.id;

with ranked_services as (
  select
    id,
    row_number() over (partition by name order by id) as rn
  from services
)
delete from services s
using ranked_services r
where s.id = r.id
  and r.rn > 1;

-- Dedupe recurring availability rows before adding a unique index.
with ranked_availability as (
  select
    id,
    row_number() over (
      partition by day_of_week, start_time, end_time, slot_length_minutes
      order by id
    ) as rn
  from availability
)
delete from availability a
using ranked_availability r
where a.id = r.id
  and r.rn > 1;

create unique index if not exists services_name_unique_idx
  on services (name);

create unique index if not exists availability_unique_slot_idx
  on availability (day_of_week, start_time, end_time, slot_length_minutes);

create unique index if not exists appointments_unique_start_time
  on appointments (start_time);

create index if not exists appointments_start_time_idx
  on appointments (start_time);

create index if not exists blocked_periods_start_time_idx
  on blocked_periods (start_time);

create index if not exists blocked_periods_end_time_idx
  on blocked_periods (end_time);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_overlap'
  ) then
    alter table appointments
      add constraint appointments_no_overlap
      exclude using gist (
        tstzrange(start_time, end_time, '[)') with &&
      )
      where (status <> 'cancelled');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'blocked_periods_no_overlap'
  ) then
    alter table blocked_periods
      add constraint blocked_periods_no_overlap
      exclude using gist (
        tstzrange(start_time, end_time, '[)') with &&
      );
  end if;
end
$$;
