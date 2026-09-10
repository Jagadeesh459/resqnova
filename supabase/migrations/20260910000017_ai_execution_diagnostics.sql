-- Durable AI execution state for synchronized SOS triage and dispatch.

alter table public.citizen_requests
  add column if not exists ai_stage text not null default 'received'
    check (ai_stage in ('received', 'processing', 'risk_calculated', 'assigned', 'notified', 'resolved', 'failed')),
  add column if not exists risk_score numeric(8,2) not null default 0 check (risk_score between 0 and 100),
  add column if not exists ai_dispatch_rescue boolean not null default false,
  add column if not exists ai_dispatch_ambulance boolean not null default false,
  add column if not exists recommended_shelter_id uuid references public.shelters(id) on delete set null,
  add column if not exists recommended_hospital_id uuid references public.hospitals(id) on delete set null,
  add column if not exists ai_input jsonb,
  add column if not exists ai_output jsonb,
  add column if not exists ai_error text;

create table if not exists public.ai_execution_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.citizen_requests(id) on delete cascade,
  step text not null check (step in ('sos_received', 'ai_triggered', 'risk_calculated', 'rescue_assigned', 'ambulance_assigned', 'shelter_assigned', 'notifications_sent', 'failed')),
  status text not null check (status in ('pending', 'success', 'failed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_execution_logs_request_idx on public.ai_execution_logs(request_id, created_at);
create index if not exists citizen_requests_ai_stage_idx on public.citizen_requests(ai_stage, priority_score desc, created_at desc);

alter table public.ai_execution_logs enable row level security;

drop policy if exists "users can view related ai logs" on public.ai_execution_logs;
create policy "users can view related ai logs" on public.ai_execution_logs
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.citizen_requests request
      join public.users profile on profile.id = request.citizen_id
      where request.id = ai_execution_logs.request_id
        and profile.auth_id = auth.uid()
    )
    or public.has_role('rescue')
    or public.has_role('ambulance')
  );

grant select on public.ai_execution_logs to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ai_execution_logs'
  ) then
    alter publication supabase_realtime add table public.ai_execution_logs;
  end if;
end $$;
