-- Make the shared Vijayawada operational state visible and realtime across roles.
-- Portal screens still receive only authenticated data; service-role dispatch remains server-only.

alter table public.citizen_requests
  add column if not exists shelter_id uuid references public.shelters(id) on delete set null;

drop policy if exists "request owners and responders can view requests" on public.citizen_requests;
create policy "request owners and operational roles can view requests" on public.citizen_requests
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
    or public.has_role('rescue')
    or public.has_role('ambulance')
  );

drop policy if exists "rescue managers can update missions" on public.rescue_missions;
create policy "rescue operators can update missions" on public.rescue_missions
  for update to authenticated
  using (
    public.is_admin()
    or public.has_role('rescue')
    or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid())
  )
  with check (
    public.is_admin()
    or public.has_role('rescue')
    or exists (select 1 from public.rescue_teams t where t.id = rescue_team_id and t.manager_auth_id = auth.uid())
  );

drop policy if exists "mission participants can view missions" on public.rescue_missions;
create policy "operational roles can view missions" on public.rescue_missions
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('rescue')
    or public.has_role('ambulance')
    or exists (select 1 from public.citizen_requests r join public.users u on u.id = r.citizen_id where r.id = public.rescue_missions.request_id and u.auth_id = auth.uid())
  );

drop policy if exists "rescue managers can update own team" on public.rescue_teams;
create policy "rescue operators can update teams" on public.rescue_teams
  for update to authenticated
  using (public.is_admin() or public.has_role('rescue') or manager_auth_id = auth.uid())
  with check (public.is_admin() or public.has_role('rescue') or manager_auth_id = auth.uid());

drop policy if exists "ambulance managers can update own vehicle" on public.ambulances;
create policy "ambulance operators can update vehicles" on public.ambulances
  for update to authenticated
  using (public.is_admin() or public.has_role('ambulance') or manager_auth_id = auth.uid())
  with check (public.is_admin() or public.has_role('ambulance') or manager_auth_id = auth.uid());

grant select, update on public.citizen_requests, public.rescue_missions, public.rescue_teams, public.ambulances to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['ambulances', 'rescue_teams', 'hospitals', 'shelters', 'roads', 'flood_risk', 'deployment_zones', 'citizen_requests', 'rescue_missions'] loop
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relkind in ('r', 'p')
    )
      and not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
