-- Stage 6: parent accounts, children, per-child settings and meal history.
-- Everything lives in its own schema so it can share a Supabase project with other apps
-- and be moved out later (dump this schema + replay these migrations).
-- Device tables (devices, device_state, device_commands) come in stage 7.

create schema if not exists nyamnyam;
grant usage on schema nyamnyam to authenticated, service_role;

create table nyamnyam.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  -- SHA-256 of "<user id>:<pin>": a child lock, not a security boundary (login is).
  parent_pin_hash text,
  created_at timestamptz not null default now()
);

create table nyamnyam.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  age int check (age between 1 and 12),
  theme_character text not null default 'nyamnyam'
    check (theme_character in ('nyamnyam', 'pongdang', 'banjjak')),
  theme_map text not null default 'post' check (theme_map in ('post', 'sea', 'space')),
  created_at timestamptz not null default now()
);

create table nyamnyam.settings (
  child_id uuid primary key references nyamnyam.children on delete cascade,
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  completion_mode text not null default 'amount'
    check (completion_mode in ('amount', 'meals', 'cumulative')),
  meals_per_picture int not null default 7 check (meals_per_picture between 2 and 30),
  meal_complete_pct int not null default 70 check (meal_complete_pct between 10 and 100),
  cumulative_target_g int not null default 2000 check (cumulative_target_g between 100 and 20000),
  stage_thresholds int[] not null default '{10,25,40,55,70,85,95}'
    check (array_length(stage_thresholds, 1) = 7),
  full_button_enabled boolean not null default true,
  full_button_stamp_pct int not null default 70 check (full_button_stamp_pct between 0 and 100),
  idle_seconds int not null default 30 check (idle_seconds between 10 and 300),
  idle_max_prompts int not null default 3 check (idle_max_prompts between 0 and 10),
  sfx_volume real not null default 1 check (sfx_volume between 0 and 1),
  voice_volume real not null default 1 check (voice_volume between 0 and 1),
  show_percent boolean not null default true,
  child_picks_theme boolean not null default true,
  refill_policy text not null default 'count' check (refill_policy in ('count', 'ignore')),
  anomaly_detection boolean not null default true,
  updated_at timestamptz not null default now()
);

create table nyamnyam.meals (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references nyamnyam.children on delete cascade,
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  served_g int not null check (served_g >= 0),
  eaten_g int not null check (eaten_g >= 0),
  max_progress real not null check (max_progress between 0 and 1),
  -- Reached the completion bar of the child's mode (meals mode: meal_complete_pct).
  completed boolean not null,
  ended_by text not null check (ended_by in ('auto', 'full_button', 'parent'))
);
create index meals_child_ended on nyamnyam.meals (child_id, ended_at desc);

create table nyamnyam.pictures (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references nyamnyam.children on delete cascade,
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  map text not null check (map in ('post', 'sea', 'space')),
  character text not null check (character in ('nyamnyam', 'pongdang', 'banjjak')),
  completed_at timestamptz not null default now(),
  meal_ids uuid[] not null default '{}'
);
create index pictures_child_completed on nyamnyam.pictures (child_id, completed_at desc);

create table nyamnyam.stamps (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references nyamnyam.children on delete cascade,
  parent_id uuid not null default auth.uid() references nyamnyam.profiles on delete cascade,
  date date not null default current_date,
  meal_id uuid unique references nyamnyam.meals on delete set null
);
create index stamps_child_date on nyamnyam.stamps (child_id, date desc);

create function nyamnyam.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger settings_touch before update on nyamnyam.settings
  for each row execute function nyamnyam.touch_updated_at();

-- RLS: a parent only ever sees their own rows, and child-owned rows must point at their child.
alter table nyamnyam.profiles enable row level security;
alter table nyamnyam.children enable row level security;
alter table nyamnyam.settings enable row level security;
alter table nyamnyam.meals enable row level security;
alter table nyamnyam.pictures enable row level security;
alter table nyamnyam.stamps enable row level security;

create policy own_profile on nyamnyam.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_children on nyamnyam.children for all to authenticated
  using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));

create function nyamnyam.owns_child(child uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from nyamnyam.children c
    where c.id = child and c.parent_id = (select auth.uid())
  )
$$;

create policy own_settings on nyamnyam.settings for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()) and nyamnyam.owns_child(child_id));
create policy own_meals on nyamnyam.meals for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()) and nyamnyam.owns_child(child_id));
create policy own_pictures on nyamnyam.pictures for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()) and nyamnyam.owns_child(child_id));
create policy own_stamps on nyamnyam.stamps for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()) and nyamnyam.owns_child(child_id));

grant select, insert, update, delete on all tables in schema nyamnyam to authenticated;
grant execute on function nyamnyam.owns_child(uuid) to authenticated;
grant all on all tables in schema nyamnyam to service_role;
