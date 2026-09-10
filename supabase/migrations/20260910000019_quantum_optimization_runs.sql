-- Durable Quantum Operations Center output for live Vijayawada decisions.

create table if not exists public.quantum_optimization_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('preposition', 'rescue', 'ambulance', 'evacuation', 'reoptimize', 'benchmark')),
  status text not null check (status in ('completed', 'failed', 'unavailable')),
  engine text not null default 'qaoa_statevector',
  request_id uuid references public.citizen_requests(id) on delete set null,
  bitstring text,
  qubo_cost numeric,
  probability numeric,
  expectation numeric,
  runtime_ms numeric,
  input_summary jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists quantum_optimization_runs_created_idx on public.quantum_optimization_runs(created_at desc);
create index if not exists quantum_optimization_runs_mode_idx on public.quantum_optimization_runs(mode, status, created_at desc);

alter table public.quantum_optimization_runs enable row level security;
create policy "authenticated users can view quantum runs" on public.quantum_optimization_runs
  for select to authenticated using (true);
grant select on public.quantum_optimization_runs to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'quantum_optimization_runs'
  ) then
    alter publication supabase_realtime add table public.quantum_optimization_runs;
  end if;
end $$;
