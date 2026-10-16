-- Stage 7: scales (ESP32 + load cell). The device never talks to these tables directly:
-- it calls the Edge Functions device-ingest / device-commands (supabase/functions), which
-- check device_id + device_key and write with the service role. Parents read their own
-- scales here, and the child screen follows device_state over Realtime.
-- API contract: docs/FIRMWARE_NOTES.md §3.

create table nyamnyam.devices (
  -- Made by the parent screen ("nyam-" + 6 letters/digits) and written into secrets.h.
  id text primary key check (id ~ '^nyam-[a-z0-9]{6}$'),
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  -- SHA-256 hex of the device key (48 random hex chars, shown to the parent once).
  device_key_hash text not null check (device_key_hash ~ '^[0-9a-f]{64}$'),
  name text not null default '냠냠 저울' check (char_length(name) between 1 and 20),
  last_seen_at timestamptz,
  -- Reported by the device after tare / calibrate (it keeps its own copy in NVS).
  calibration_factor real,
  tare_offset real,
  created_at timestamptz not null default now()
);

create table nyamnyam.device_state (
  device_id text primary key references nyamnyam.devices on delete cascade,
  -- Copied from devices so Realtime can check RLS without a join.
  parent_id uuid not null references nyamnyam.profiles on delete cascade,
  grams real not null,
  raw real not null,
  stable boolean not null,
  seq bigint not null,
  ts bigint not null,
  updated_at timestamptz not null default now()
);

create table nyamnyam.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references nyamnyam.devices on delete cascade,
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  type text not null check (type in ('tare', 'calibrate', 'reboot')),
  -- calibrate: {"knownGrams": 510}; others: {}
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'done', 'error')),
  -- Device's answer: {"error": "unstable"} or {"calibrationFactor": ..., "tareOffset": ...}
  result jsonb,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  check (type <> 'calibrate' or (payload->>'knownGrams')::real between 10 and 5000)
);
create index device_commands_pending on nyamnyam.device_commands (device_id, created_at)
  where status = 'pending';

alter table nyamnyam.devices enable row level security;
alter table nyamnyam.device_state enable row level security;
alter table nyamnyam.device_commands enable row level security;

create function nyamnyam.owns_device(device text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from nyamnyam.devices d
    where d.id = device and d.parent_id = (select auth.uid())
  )
$$;

create policy own_devices on nyamnyam.devices for all to authenticated
  using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
create policy own_device_state on nyamnyam.device_state for select to authenticated
  using (parent_id = (select auth.uid()));
create policy own_device_commands on nyamnyam.device_commands for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()) and nyamnyam.owns_device(device_id));

-- Parents register, rename and remove scales and send commands; only the Edge Functions
-- (service role) write readings, command results and calibration values.
revoke all on nyamnyam.devices, nyamnyam.device_state, nyamnyam.device_commands
  from anon, authenticated;
grant select, delete on nyamnyam.devices to authenticated;
grant insert (id, name, device_key_hash) on nyamnyam.devices to authenticated;
grant update (name) on nyamnyam.devices to authenticated;
grant select on nyamnyam.device_state to authenticated;
grant select on nyamnyam.device_commands to authenticated;
grant insert (device_id, type, payload) on nyamnyam.device_commands to authenticated;
grant execute on function nyamnyam.owns_device(text) to authenticated;
grant all on nyamnyam.devices, nyamnyam.device_state, nyamnyam.device_commands to service_role;

-- The child screen subscribes to its scale's row (postgres_changes, RLS applies).
alter publication supabase_realtime add table nyamnyam.device_state;
