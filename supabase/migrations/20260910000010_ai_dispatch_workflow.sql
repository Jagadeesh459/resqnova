-- AI dispatch workflow fields and trusted assignment links.

alter table public.citizen_requests
  add column if not exists ai_reason text,
  add column if not exists ai_recommendation text,
  add column if not exists ai_processed_at timestamptz,
  add column if not exists ambulance_required boolean not null default false,
  add column if not exists dispatch_source text not null default 'pending';

alter table public.rescue_teams
  add column if not exists assigned_request_id uuid references public.citizen_requests(id) on delete set null;

alter table public.ambulances
  add column if not exists assigned_request_id uuid references public.citizen_requests(id) on delete set null;

create index if not exists citizen_requests_dispatch_idx on public.citizen_requests(status, priority_score desc, created_at desc);
create index if not exists rescue_teams_request_idx on public.rescue_teams(assigned_request_id);
create index if not exists ambulances_request_idx on public.ambulances(assigned_request_id);

create policy "admins can create notifications" on public.notifications for insert to authenticated
  with check (public.is_admin());

create policy "assigned responders can update requests" on public.citizen_requests for update to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid())
    or exists (select 1 from public.ambulances a where a.id = ambulance_id and a.manager_auth_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid())
    or exists (select 1 from public.ambulances a where a.id = ambulance_id and a.manager_auth_id = auth.uid())
  );

grant select, insert, update on public.citizen_requests, public.rescue_teams, public.ambulances to authenticated;
