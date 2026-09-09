create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'citizen', 'rescue', 'ambulance', 'shelter', 'hospital');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.user_role not null default 'citizen',
  district text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'ResQNova user'),
    coalesce(new.email, concat(new.id, '@resqnova.local')),
    new.phone,
    'citizen'
  )
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create table if not exists public.rescue_teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  leader text not null,
  manager_auth_id uuid references auth.users(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'available' check (status in ('available', 'deployed', 'standby', 'offline')),
  assigned_incident uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.ambulances (
  id uuid primary key default gen_random_uuid(),
  vehicle_code text not null unique,
  manager_auth_id uuid references auth.users(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'available' check (status in ('available', 'dispatched', 'maintenance', 'offline')),
  assigned_incident uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.shelters (
  id uuid primary key default gen_random_uuid(),
  shelter_name text not null,
  manager_auth_id uuid references auth.users(id) on delete set null,
  district text not null,
  latitude double precision not null,
  longitude double precision not null,
  capacity integer not null check (capacity >= 0),
  available_capacity integer not null check (available_capacity >= 0),
  food_stock integer not null default 0 check (food_stock >= 0),
  medical_stock integer not null default 0 check (medical_stock >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null,
  manager_auth_id uuid references auth.users(id) on delete set null,
  district text not null,
  latitude double precision not null,
  longitude double precision not null,
  total_beds integer not null check (total_beds >= 0),
  available_beds integer not null check (available_beds >= 0),
  emergency_capacity integer not null default 0 check (emergency_capacity >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  description text not null,
  disaster_type text not null,
  latitude double precision not null,
  longitude double precision not null,
  district text not null,
  priority numeric(5, 2) not null default 0 check (priority between 0 and 100),
  confidence numeric(5, 2) not null default 0 check (confidence between 0 and 100),
  status text not null default 'reported' check (status in ('reported', 'acknowledged', 'dispatched', 'resolved', 'closed')),
  assigned_rescue_team uuid references public.rescue_teams(id) on delete set null,
  assigned_ambulance uuid references public.ambulances(id) on delete set null,
  assigned_hospital uuid references public.hospitals(id) on delete set null,
  assigned_shelter uuid references public.shelters(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.rescue_teams
  add constraint rescue_teams_assigned_incident_fkey foreign key (assigned_incident) references public.incidents(id) on delete set null;

alter table public.ambulances
  add constraint ambulances_assigned_incident_fkey foreign key (assigned_incident) references public.incidents(id) on delete set null;

create table if not exists public.roads (
  id uuid primary key default gen_random_uuid(),
  road_name text not null,
  district text not null,
  status text not null default 'open' check (status in ('open', 'blocked', 'restricted', 'under_review')),
  blocked_reason text,
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  district text not null,
  created_at timestamptz not null default now()
);

create index if not exists incidents_citizen_id_idx on public.incidents(citizen_id);
create index if not exists incidents_status_idx on public.incidents(status);
create index if not exists incidents_district_idx on public.incidents(district);
create index if not exists rescue_teams_assigned_incident_idx on public.rescue_teams(assigned_incident);
create index if not exists ambulances_assigned_incident_idx on public.ambulances(assigned_incident);
create index if not exists shelters_district_idx on public.shelters(district);
create index if not exists hospitals_district_idx on public.hospitals(district);
create index if not exists roads_district_idx on public.roads(district);
create index if not exists alerts_district_idx on public.alerts(district);

create or replace function public.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.has_role('admin'); $$;

create or replace view public.dashboard_metrics as
select
  (select count(*) from public.incidents where status not in ('resolved', 'closed'))::integer as active_incidents,
  (select count(*) from public.ambulances where status != 'offline')::integer as ambulances,
  (select count(*) from public.rescue_teams where status != 'offline')::integer as rescue_teams,
  (select count(*) from public.shelters)::integer as shelters;

grant select on public.dashboard_metrics to anon, authenticated;

alter table public.users enable row level security;
alter table public.incidents enable row level security;
alter table public.rescue_teams enable row level security;
alter table public.ambulances enable row level security;
alter table public.shelters enable row level security;
alter table public.hospitals enable row level security;
alter table public.roads enable row level security;
alter table public.alerts enable row level security;

create policy "users can view own profile" on public.users for select to authenticated using (auth_id = auth.uid() or public.is_admin());
create policy "users can insert own profile" on public.users for insert to authenticated with check (auth_id = auth.uid() or public.is_admin());
create policy "users can update own profile" on public.users for update to authenticated using (auth_id = auth.uid() or public.is_admin()) with check (auth_id = auth.uid() or public.is_admin());
create policy "admins can delete users" on public.users for delete to authenticated using (public.is_admin());

create policy "incident visibility is role scoped" on public.incidents for select to authenticated using (
  public.is_admin()
  or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
  or exists (select 1 from public.rescue_teams t where t.id = assigned_rescue_team and t.manager_auth_id = auth.uid())
  or exists (select 1 from public.ambulances a where a.id = assigned_ambulance and a.manager_auth_id = auth.uid())
  or exists (select 1 from public.hospitals h where h.id = assigned_hospital and h.manager_auth_id = auth.uid())
  or exists (select 1 from public.shelters s where s.id = assigned_shelter and s.manager_auth_id = auth.uid())
);
create policy "citizens can create own incidents" on public.incidents for insert to authenticated with check (
  public.is_admin() or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
);
create policy "citizens can update own incidents" on public.incidents for update to authenticated using (
  public.is_admin() or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
) with check (
  public.is_admin() or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
);
create policy "admins can delete incidents" on public.incidents for delete to authenticated using (public.is_admin());

create policy "authenticated users can view rescue teams" on public.rescue_teams for select to authenticated using (true);
create policy "rescue managers can update own team" on public.rescue_teams for update to authenticated using (manager_auth_id = auth.uid() or public.is_admin()) with check (manager_auth_id = auth.uid() or public.is_admin());
create policy "admins can manage rescue teams" on public.rescue_teams for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can view ambulances" on public.ambulances for select to authenticated using (true);
create policy "ambulance managers can update own vehicle" on public.ambulances for update to authenticated using (manager_auth_id = auth.uid() or public.is_admin()) with check (manager_auth_id = auth.uid() or public.is_admin());
create policy "admins can manage ambulances" on public.ambulances for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can view shelters" on public.shelters for select to authenticated using (true);
create policy "shelter managers can update own shelter" on public.shelters for update to authenticated using (manager_auth_id = auth.uid() or public.is_admin()) with check (manager_auth_id = auth.uid() or public.is_admin());
create policy "admins can manage shelters" on public.shelters for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can view hospitals" on public.hospitals for select to authenticated using (true);
create policy "hospital managers can update own hospital" on public.hospitals for update to authenticated using (manager_auth_id = auth.uid() or public.is_admin()) with check (manager_auth_id = auth.uid() or public.is_admin());
create policy "admins can manage hospitals" on public.hospitals for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users can view roads" on public.roads for select to authenticated using (true);
create policy "admins can manage roads" on public.roads for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated users can view alerts" on public.alerts for select to authenticated using (true);
create policy "admins can manage alerts" on public.alerts for all to authenticated using (public.is_admin()) with check (public.is_admin());
