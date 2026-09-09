alter table public.roads add column if not exists name text;
alter table public.roads add column if not exists start_lat numeric(9,6);
alter table public.roads add column if not exists start_lng numeric(9,6);
alter table public.roads add column if not exists end_lat numeric(9,6);
alter table public.roads add column if not exists end_lng numeric(9,6);
alter table public.roads add column if not exists road_type text;
update public.roads set name = road_name where name is null;

alter table public.hospitals add column if not exists icu_beds integer not null default 0 check (icu_beds >= 0);
alter table public.hospitals add column if not exists ambulances_available integer not null default 0 check (ambulances_available >= 0);
alter table public.shelters add column if not exists occupancy integer not null default 0 check (occupancy >= 0);
alter table public.shelters add column if not exists water_stock integer not null default 0 check (water_stock >= 0);
alter table public.shelters add column if not exists power_backup boolean not null default false;
alter table public.ambulances add column if not exists crew_size integer not null default 2 check (crew_size > 0);
alter table public.ambulances add column if not exists fuel numeric(6,2) not null default 100 check (fuel between 0 and 100);
alter table public.rescue_teams add column if not exists team_type text;
alter table public.rescue_teams add column if not exists personnel integer not null default 0 check (personnel >= 0);
alter table public.rescue_teams add column if not exists equipment text[] not null default '{}';
alter table public.rescue_teams add column if not exists readiness text not null default 'standby';

create table if not exists public.risk_zones (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null,
  district text not null default 'NTR',
  risk_level text not null check (risk_level in ('moderate', 'high', 'critical')),
  risk_score numeric(5,2) not null check (risk_score between 0 and 100),
  polygon jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.travel_time_edges (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  destination text not null,
  distance numeric(8,2) not null check (distance >= 0),
  normal_time integer not null check (normal_time >= 0),
  emergency_time integer not null check (emergency_time >= 0),
  congestion_factor numeric(5,2) not null default 1 check (congestion_factor >= 0),
  road_status text not null default 'open',
  created_at timestamptz not null default now(),
  unique (source, destination)
);

create index if not exists roads_vijayawada_geometry_idx on public.roads (district, road_type);
create index if not exists hospitals_vijayawada_idx on public.hospitals (district);
create index if not exists shelters_vijayawada_idx on public.shelters (district);
create index if not exists risk_zones_district_idx on public.risk_zones (district, risk_level);
create index if not exists travel_time_edges_source_idx on public.travel_time_edges (source);

alter table public.risk_zones enable row level security;
alter table public.travel_time_edges enable row level security;
create policy "public can view risk zones" on public.risk_zones for select to anon, authenticated using (true);
create policy "admins can manage risk zones" on public.risk_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public can view travel time edges" on public.travel_time_edges for select to anon, authenticated using (true);
create policy "admins can manage travel time edges" on public.travel_time_edges for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.risk_zones, public.travel_time_edges to anon, authenticated;

create or replace function public.get_public_map_data()
returns jsonb
language sql stable security definer set search_path = public
as $$
select jsonb_build_object(
  'incidents', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'disaster_type', i.disaster_type, 'latitude', i.latitude, 'longitude', i.longitude, 'district', i.district, 'priority', i.priority, 'confidence', i.confidence, 'status', i.status, 'assigned_rescue_team', i.assigned_rescue_team, 'assigned_ambulance', i.assigned_ambulance, 'assigned_hospital', i.assigned_hospital, 'assigned_shelter', i.assigned_shelter) order by i.created_at desc) from public.incidents i where i.district = 'NTR'), '[]'::jsonb),
  'rescueTeams', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'team_name', t.team_name, 'leader', t.leader, 'latitude', t.latitude, 'longitude', t.longitude, 'status', t.status, 'assigned_incident', t.assigned_incident, 'team_type', t.team_type, 'personnel', t.personnel, 'equipment', t.equipment, 'readiness', t.readiness, 'updated_at', t.updated_at) order by t.updated_at desc) from public.rescue_teams t where t.deployment_zone ilike 'NTR%'), '[]'::jsonb),
  'ambulances', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'vehicle_code', a.vehicle_code, 'latitude', a.latitude, 'longitude', a.longitude, 'status', a.status, 'assigned_incident', a.assigned_incident, 'deployment_zone', a.deployment_zone, 'crew_size', a.crew_size, 'fuel', a.fuel, 'updated_at', a.updated_at) order by a.updated_at desc) from public.ambulances a where a.deployment_zone ilike 'NTR%'), '[]'::jsonb),
  'shelters', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'shelter_name', s.shelter_name, 'district', s.district, 'latitude', s.latitude, 'longitude', s.longitude, 'capacity', s.capacity, 'available_capacity', s.available_capacity, 'occupancy', s.occupancy, 'food_stock', s.food_stock, 'water_stock', s.water_stock, 'medical_stock', s.medical_stock, 'power_backup', s.power_backup) order by s.updated_at desc) from public.shelters s where s.district = 'NTR'), '[]'::jsonb),
  'hospitals', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'hospital_name', h.hospital_name, 'district', h.district, 'latitude', h.latitude, 'longitude', h.longitude, 'total_beds', h.total_beds, 'available_beds', h.available_beds, 'emergency_capacity', h.emergency_capacity, 'icu_beds', h.icu_beds, 'ambulances_available', h.ambulances_available) order by h.updated_at desc) from public.hospitals h where h.district = 'NTR'), '[]'::jsonb),
  'roads', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'road_name', r.road_name, 'name', r.name, 'district', r.district, 'status', r.status, 'blocked_reason', r.blocked_reason, 'travel_time', r.travel_time, 'risk_score', r.risk_score, 'road_type', r.road_type, 'start_lat', r.start_lat, 'start_lng', r.start_lng, 'end_lat', r.end_lat, 'end_lng', r.end_lng) order by r.updated_at desc) from public.roads r where r.district = 'NTR'), '[]'::jsonb)
);
$$;

grant execute on function public.get_public_map_data() to anon, authenticated;

create or replace function public.get_preparedness_metrics()
returns jsonb
language sql stable security definer set search_path = public
as $$
with risk as (
  select count(*) filter (where risk_level in ('high', 'critical')) as high_risk_zones
  from public.risk_zones where district = 'NTR'
), ambulances as (
  select count(*) filter (where status = 'available') as ready_ambulances from public.ambulances where deployment_zone ilike 'NTR%'
), teams as (
  select count(*) filter (where status in ('available', 'standby', 'deployed') and readiness in ('ready', 'standby')) as ready_rescue_teams from public.rescue_teams where deployment_zone ilike 'NTR%'
), shelters as (
  select coalesce(sum(available_capacity), 0) as available_shelter_capacity from public.shelters where district = 'NTR'
)
select jsonb_build_object(
  'high_risk_zones', risk.high_risk_zones,
  'ready_ambulances', ambulances.ready_ambulances,
  'ready_rescue_teams', teams.ready_rescue_teams,
  'available_shelter_capacity', shelters.available_shelter_capacity,
  'forecast_status', case when risk.high_risk_zones > 0 then 'Watch' else 'Monitoring' end,
  'resource_readiness', case when ambulances.ready_ambulances + teams.ready_rescue_teams > 0 then 'Staged' else 'Planning' end,
  'evacuation_readiness', case when shelters.available_shelter_capacity > 0 then 'Planning' else 'Planning' end
)
from risk, ambulances, teams, shelters;
$$;

grant execute on function public.get_preparedness_metrics() to anon, authenticated;
