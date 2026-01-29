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
  last_initial text,
  contact_email text,
  contact_phone text,
  notes text,
  status text not null default 'booked',
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check ((contact_email is not null) or (contact_phone is not null))
);

create unique index if not exists appointments_unique_start_time
  on appointments (start_time);

create index if not exists appointments_start_time_idx
  on appointments (start_time);
