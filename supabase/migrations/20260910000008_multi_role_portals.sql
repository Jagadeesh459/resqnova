-- Shared workflow contract for Citizen, Rescue, Ambulance, and Authority portals.

create table if not exists public.citizen_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  emergency_contact text,
  role public.user_role not null default 'citizen',
  created_at timestamptz not null default now(),
  constraint citizen_profiles_role_check check (role = 'citizen')
);

create table if not exists public.citizen_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique default ('SOS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  citizen_id uuid not null references public.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  people_count integer not null default 1 check (people_count > 0),
  emergency_type text not null,
  photo_url text,
  voice_note_url text,
  risk_level text not null default 'moderate' check (risk_level in ('safe', 'moderate', 'high', 'critical')),
  ai_confidence numeric(5,2) not null default 0 check (ai_confidence between 0 and 100),
  priority_score numeric(8,2) not null default 0 check (priority_score >= 0),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled')),
  rescue_team_id uuid references public.rescue_teams(id) on delete set null,
  ambulance_id uuid references public.ambulances(id) on delete set null,
  assigned_at timestamptz,
  eta timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rescue_missions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.citizen_requests(id) on delete cascade,
  rescue_team_id uuid not null references public.rescue_teams(id) on delete restrict,
  ambulance_id uuid references public.ambulances(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  mission_status text not null default 'assigned' check (mission_status in ('assigned', 'en_route', 'on_scene', 'returning', 'completed')),
  readiness text not null default 'ready' check (readiness in ('ready', 'standby', 'unavailable')),
  last_updated timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  citizen_id uuid references public.citizen_requests(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists citizen_profiles_auth_id_idx on public.citizen_profiles(auth_id);
create index if not exists citizen_requests_citizen_status_idx on public.citizen_requests(citizen_id, status);
create index if not exists citizen_requests_location_idx on public.citizen_requests(latitude, longitude);
create index if not exists citizen_requests_created_at_idx on public.citizen_requests(created_at desc);
create index if not exists rescue_missions_team_status_idx on public.rescue_missions(rescue_team_id, mission_status);
create index if not exists rescue_missions_updated_idx on public.rescue_missions(last_updated desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read, created_at desc);

alter table public.citizen_profiles enable row level security;
alter table public.citizen_requests enable row level security;
alter table public.rescue_missions enable row level security;
alter table public.notifications enable row level security;

create policy "citizens can view own citizen profile" on public.citizen_profiles for select to authenticated
  using (auth_id = auth.uid() or public.is_admin());
create policy "citizens can update own citizen profile" on public.citizen_profiles for update to authenticated
  using (auth_id = auth.uid() or public.is_admin()) with check (auth_id = auth.uid() or public.is_admin());
create policy "admins can manage citizen profiles" on public.citizen_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "request owners and responders can view requests" on public.citizen_requests for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
    or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid())
    or exists (select 1 from public.ambulances a where a.id = ambulance_id and a.manager_auth_id = auth.uid())
  );
create policy "citizens can create own requests" on public.citizen_requests for insert to authenticated
  with check (public.is_admin() or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid()));
create policy "request owners and admins can update requests" on public.citizen_requests for update to authenticated
  using (public.is_admin() or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid()));
create policy "admins can delete requests" on public.citizen_requests for delete to authenticated using (public.is_admin());

create policy "mission participants can view missions" on public.rescue_missions for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid())
    or exists (select 1 from public.citizen_requests r join public.users u on u.id = r.citizen_id where r.id = public.rescue_missions.request_id and u.auth_id = auth.uid())
  );
create policy "rescue managers can update missions" on public.rescue_missions for update to authenticated
  using (public.is_admin() or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid()));
create policy "admins can manage missions" on public.rescue_missions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "users can view own notifications" on public.notifications for select to authenticated
  using (public.is_admin() or exists (select 1 from public.users u where u.id = user_id and u.auth_id = auth.uid()));
create policy "users can update own notifications" on public.notifications for update to authenticated
  using (public.is_admin() or exists (select 1 from public.users u where u.id = user_id and u.auth_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.users u where u.id = user_id and u.auth_id = auth.uid()));
create policy "admins can manage notifications" on public.notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.citizen_profiles, public.citizen_requests, public.rescue_missions, public.notifications to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'citizen_requests') then
    alter publication supabase_realtime add table public.citizen_requests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rescue_missions') then
    alter publication supabase_realtime add table public.rescue_missions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare requested_role public.user_role;
begin
  requested_role := case when new.raw_user_meta_data ->> 'role' in ('citizen', 'rescue', 'ambulance', 'shelter', 'hospital', 'admin') then (new.raw_user_meta_data ->> 'role')::public.user_role else 'citizen'::public.user_role end;
  insert into public.users (auth_id, full_name, email, phone, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'ResQNova user'), coalesce(new.email, concat(new.id, '@resqnova.local')), new.phone, requested_role)
  on conflict (auth_id) do update set full_name = excluded.full_name, phone = excluded.phone;
  return new;
end;
$$;
