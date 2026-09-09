-- Allow authenticated rescue and ambulance operators to advance assigned workflow state.

drop policy if exists "assigned responders can update requests" on public.citizen_requests;
create policy "assigned responders and operators can update requests" on public.citizen_requests
  for update to authenticated
  using (
    public.is_admin()
    or public.has_role('rescue')
    or public.has_role('ambulance')
    or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
  )
  with check (
    public.is_admin()
    or public.has_role('rescue')
    or public.has_role('ambulance')
    or exists (select 1 from public.users u where u.id = citizen_id and u.auth_id = auth.uid())
  );
