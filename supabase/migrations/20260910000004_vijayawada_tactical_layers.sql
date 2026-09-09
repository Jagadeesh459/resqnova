create table if not exists public.deployment_zones (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null,
  district text not null default 'NTR',
  ready_units integer not null default 0 check (ready_units >= 0),
  capacity integer not null default 0 check (capacity >= 0),
  coverage numeric(6,2) not null default 0 check (coverage between 0 and 100),
  polygon jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists deployment_zones_district_idx on public.deployment_zones (district);
alter table public.deployment_zones enable row level security;
create policy "public can view deployment zones" on public.deployment_zones for select to anon, authenticated using (true);
create policy "admins can manage deployment zones" on public.deployment_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.deployment_zones to anon, authenticated;

create or replace view public.flood_risk as
select id, zone_name, district, risk_level, risk_score, polygon, created_at
from public.risk_zones;

grant select on public.flood_risk to anon, authenticated;
