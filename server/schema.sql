-- Simple scheduling schema (non-HIPAA)

create extension if not exists pgcrypto;

-- Bookable appointment types (single source of truth)
create table if not exists appointment_types (
  id bigserial primary key,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if pg_get_serial_sequence('public.appointment_types', 'id') is null then
    if to_regclass('public.appointment_types_id_seq') is null then
      create sequence appointment_types_id_seq;
    end if;

    perform setval(
      'appointment_types_id_seq',
      coalesce((select max(id) from appointment_types), 0) + 1,
      false
    );

    alter table appointment_types
      alter column id set default nextval('appointment_types_id_seq');
    alter sequence appointment_types_id_seq owned by appointment_types.id;
  end if;
end
$$;

-- Display-only service catalog items (sub-services) mapped to appointment types
create table if not exists service_catalog (
  id bigserial primary key,
  name text not null,
  description text not null,
  category text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_range text,
  image_url text,
  appointment_type_id bigint not null references appointment_types(id) on delete restrict,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Public team directory profiles
create table if not exists team_members (
  id text primary key,
  full_name text not null,
  title text,
  specialty text not null,
  bio text,
  photo_url text,
  education text,
  years_experience integer check (years_experience >= 0),
  available_days text[] not null default '{}',
  available_hours text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin accounts for dashboard authentication
create table if not exists admin_users (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null,
  role text not null default 'admin' check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (username = lower(trim(username))),
  check (length(username) >= 3)
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
  appointment_type_id bigint references appointment_types(id) on delete set null,
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

-- Backfill/migrate from legacy services table if it exists.
alter table appointment_types add column if not exists duration_minutes integer;

-- Ensure legacy FK relationship from appointment_types -> services is removed before dropping services.
do $$
declare
  legacy_fk record;
begin
  if to_regclass('public.services') is not null and to_regclass('public.appointment_types') is not null then
    for legacy_fk in
      select conname
      from pg_constraint
      where conrelid = 'public.appointment_types'::regclass
        and confrelid = 'public.services'::regclass
    loop
      execute format('alter table appointment_types drop constraint if exists %I', legacy_fk.conname);
    end loop;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.services') is not null then
    insert into appointment_types (id, name, duration_minutes, is_active, display_order)
    select
      s.id,
      s.name,
      s.duration_minutes,
      s.is_active,
      row_number() over (order by s.id)
    from services s
    on conflict (id) do update
    set
      name = excluded.name,
      duration_minutes = excluded.duration_minutes,
      is_active = excluded.is_active;
  end if;
end
$$;

-- appointments.service_id -> appointments.appointment_type_id
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'service_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'appointment_type_id'
  ) then
    alter table appointments add column appointment_type_id bigint;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'service_id'
  ) then
    update appointments
    set appointment_type_id = service_id
    where appointment_type_id is null;

    alter table appointments drop column service_id;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_appointment_type_id_fkey'
  ) then
    alter table appointments
      add constraint appointments_appointment_type_id_fkey
      foreign key (appointment_type_id)
      references appointment_types(id)
      on delete set null;
  end if;
end
$$;

-- Drop legacy services table after successful migration.
drop table if exists services;

update appointment_types
set name = trim(name)
where name <> trim(name);

update appointment_types
set duration_minutes = 30
where duration_minutes is null;

alter table appointment_types
  alter column duration_minutes set not null;

-- Dedupe appointment types before enforcing uniqueness.
with ranked_appointment_types as (
  select
    id,
    row_number() over (partition by name order by id) as rn,
    min(id) over (partition by name) as keep_id
  from appointment_types
),
duplicate_types as (
  select id, keep_id
  from ranked_appointment_types
  where rn > 1
)
update appointments a
set appointment_type_id = d.keep_id
from duplicate_types d
where a.appointment_type_id = d.id;

with ranked_appointment_types as (
  select
    id,
    row_number() over (partition by name order by id) as rn,
    min(id) over (partition by name) as keep_id
  from appointment_types
),
duplicate_types as (
  select id, keep_id
  from ranked_appointment_types
  where rn > 1
)
update service_catalog sc
set appointment_type_id = d.keep_id
from duplicate_types d
where sc.appointment_type_id = d.id;

with ranked_appointment_types as (
  select
    id,
    row_number() over (partition by name order by id) as rn
  from appointment_types
)
delete from appointment_types at
using ranked_appointment_types r
where at.id = r.id
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

create unique index if not exists appointment_types_name_unique_idx
  on appointment_types (name);

create index if not exists appointment_types_active_order_idx
  on appointment_types (is_active, display_order, name);

create unique index if not exists service_catalog_name_unique_idx
  on service_catalog (name);

create index if not exists service_catalog_active_order_idx
  on service_catalog (is_active, display_order, name);

create index if not exists service_catalog_appointment_type_idx
  on service_catalog (appointment_type_id);

create index if not exists team_members_active_order_idx
  on team_members (is_active, display_order, full_name);

create index if not exists admin_users_active_username_idx
  on admin_users (is_active, username);

create unique index if not exists availability_unique_slot_idx
  on availability (day_of_week, start_time, end_time, slot_length_minutes);

create unique index if not exists appointments_unique_start_time
  on appointments (start_time);

create index if not exists appointments_appointment_type_id_idx
  on appointments (appointment_type_id);

create index if not exists appointments_start_time_idx
  on appointments (start_time);

create index if not exists blocked_periods_start_time_idx
  on blocked_periods (start_time);

create index if not exists blocked_periods_end_time_idx
  on blocked_periods (end_time);

-- Supabase hardening: enable RLS on exposed public tables.
-- This project uses a backend API as the data access layer, so we do not add anon/authenticated policies here.
alter table appointment_types enable row level security;
alter table service_catalog enable row level security;
alter table team_members enable row level security;
alter table admin_users enable row level security;
alter table availability enable row level security;
alter table exceptions enable row level security;
alter table appointments enable row level security;
alter table blocked_periods enable row level security;

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
