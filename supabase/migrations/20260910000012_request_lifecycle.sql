-- Durable assignment records and atomic resolution of completed missions.

alter table public.citizen_requests
  add column if not exists resolved_at timestamptz,
  add column if not exists response_time_minutes numeric(8,2),
  add column if not exists rescue_time_minutes numeric(8,2),
  add column if not exists total_duration_minutes numeric(8,2),
  add column if not exists children_count integer not null default 0,
  add column if not exists elderly_count integer not null default 0;

create table if not exists public.request_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.citizen_requests(id) on delete cascade,
  rescue_team_id uuid references public.rescue_teams(id) on delete set null,
  ambulance_id uuid references public.ambulances(id) on delete set null,
  shelter_id uuid references public.shelters(id) on delete set null,
  priority_score numeric(8,2) not null default 0,
  status text not null default 'assigned' check (status in ('assigned', 'en_route', 'on_scene', 'resolved', 'cancelled')),
  eta timestamptz,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists request_assignments_status_idx on public.request_assignments(status, priority_score desc, assigned_at desc);
create index if not exists request_assignments_rescue_idx on public.request_assignments(rescue_team_id, status);
create index if not exists request_assignments_ambulance_idx on public.request_assignments(ambulance_id, status);

alter table public.request_assignments enable row level security;
drop policy if exists "operational roles can view assignments" on public.request_assignments;
create policy "operational roles can view assignments" on public.request_assignments for select to authenticated
  using (public.is_admin() or public.has_role('rescue') or public.has_role('ambulance') or exists (select 1 from public.citizen_requests r join public.users u on u.id = r.citizen_id where r.id = public.request_assignments.request_id and u.auth_id = auth.uid()));
drop policy if exists "operational roles can update assignments" on public.request_assignments;
create policy "operational roles can update assignments" on public.request_assignments for update to authenticated
  using (public.is_admin() or public.has_role('rescue') or public.has_role('ambulance'))
  with check (public.is_admin() or public.has_role('rescue') or public.has_role('ambulance'));
grant select, update on public.request_assignments to authenticated;

create or replace function public.resolve_completed_mission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare finished_at timestamptz := coalesce(new.last_updated, now());
begin
  if new.mission_status = 'completed' and (old.mission_status is distinct from 'completed') then
    update public.citizen_requests
    set status = 'resolved', resolved_at = finished_at,
        response_time_minutes = extract(epoch from (coalesce(assigned_at, created_at) - created_at)) / 60,
        rescue_time_minutes = extract(epoch from (finished_at - coalesce(assigned_at, created_at))) / 60,
        total_duration_minutes = extract(epoch from (finished_at - created_at)) / 60
    where id = new.request_id;

    update public.rescue_teams set status = 'available', assigned_request_id = null, updated_at = finished_at where id = new.rescue_team_id;
    update public.ambulances set status = 'available', assigned_request_id = null, updated_at = finished_at where id = new.ambulance_id;
    update public.request_assignments set status = 'resolved', completed_at = finished_at, updated_at = finished_at where request_id = new.request_id;
  end if;
  return new;
end;
$$;

drop trigger if exists rescue_mission_completion on public.rescue_missions;
create trigger rescue_mission_completion
after update on public.rescue_missions
for each row execute procedure public.resolve_completed_mission();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_assignments') then
    alter publication supabase_realtime add table public.request_assignments;
  end if;
end $$;
