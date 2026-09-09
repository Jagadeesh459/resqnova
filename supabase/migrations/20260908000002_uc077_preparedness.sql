create table if not exists public.forecast_scenarios (
  id uuid primary key default gen_random_uuid(),
  scenario_name text not null,
  district text not null,
  rainfall numeric(8,2) not null default 0 check (rainfall >= 0),
  risk_level text not null default 'moderate' check (risk_level in ('low', 'moderate', 'high', 'critical')),
  created_at timestamptz not null default now()
);

alter table public.roads add column if not exists travel_time integer check (travel_time >= 0);
alter table public.roads add column if not exists risk_score numeric(5,2) check (risk_score between 0 and 100);
alter table public.ambulances add column if not exists deployment_zone text;
alter table public.rescue_teams add column if not exists deployment_zone text;

create index if not exists forecast_scenarios_district_risk_idx on public.forecast_scenarios (district, risk_level);
create index if not exists ambulances_deployment_zone_idx on public.ambulances (deployment_zone);
create index if not exists rescue_teams_deployment_zone_idx on public.rescue_teams (deployment_zone);

alter table public.forecast_scenarios enable row level security;
create policy "authenticated users can view forecast scenarios"
  on public.forecast_scenarios for select to authenticated using (true);
create policy "admins can manage forecast scenarios"
  on public.forecast_scenarios for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.get_preparedness_metrics()
returns jsonb
language sql stable security definer set search_path = public
as $$
with ntr_forecasts as (
  select count(*) filter (where risk_level in ('high', 'critical')) as high_risk_zones
  from public.forecast_scenarios where district = 'NTR'
), ntr_resources as (
  select
    count(*) filter (where status in ('available', 'dispatched')) as ready_ambulances,
    count(*) as total_ambulances
  from public.ambulances where deployment_zone ilike 'NTR%'
), ntr_teams as (
  select
    count(*) filter (where status in ('available', 'standby', 'deployed')) as ready_rescue_teams,
    count(*) as total_rescue_teams
  from public.rescue_teams where deployment_zone ilike 'NTR%'
), ntr_shelters as (
  select coalesce(sum(available_capacity), 0) as available_shelter_capacity
  from public.shelters where district = 'NTR'
)
select jsonb_build_object(
  'high_risk_zones', ntr_forecasts.high_risk_zones,
  'ready_ambulances', ntr_resources.ready_ambulances,
  'ready_rescue_teams', ntr_teams.ready_rescue_teams,
  'available_shelter_capacity', ntr_shelters.available_shelter_capacity,
  'forecast_status', case when ntr_forecasts.high_risk_zones > 0 then 'Watch' else 'Monitoring' end,
  'resource_readiness', case when ntr_resources.ready_ambulances + ntr_teams.ready_rescue_teams > 0 then 'Staged' else 'Planning' end,
  'evacuation_readiness', case when ntr_shelters.available_shelter_capacity > 0 then 'Planning' else 'Planning' end
)
from ntr_forecasts, ntr_resources, ntr_teams, ntr_shelters;
$$;

grant execute on function public.get_preparedness_metrics() to anon, authenticated;
