-- Use the Vijayawada operational dataset directly instead of the retired NTR-prefixed zones.

create or replace function public.get_public_map_data()
returns jsonb
language sql stable security definer set search_path = public
as $$
select jsonb_build_object(
  'incidents', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'disaster_type', i.disaster_type, 'latitude', i.latitude, 'longitude', i.longitude, 'district', i.district, 'priority', i.priority, 'confidence', i.confidence, 'status', i.status, 'assigned_rescue_team', i.assigned_rescue_team, 'assigned_ambulance', i.assigned_ambulance, 'assigned_hospital', i.assigned_hospital, 'assigned_shelter', i.assigned_shelter) order by i.created_at desc) from public.incidents i where i.district = 'NTR'), '[]'::jsonb),
  'rescueTeams', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'team_name', t.team_name, 'leader', t.leader, 'latitude', t.latitude, 'longitude', t.longitude, 'status', t.status, 'assigned_incident', t.assigned_incident, 'team_type', t.team_type, 'personnel', t.personnel, 'equipment', t.equipment, 'readiness', t.readiness, 'updated_at', t.updated_at) order by t.updated_at desc) from public.rescue_teams t where t.latitude between 16.45 and 16.60 and t.longitude between 80.58 and 80.73), '[]'::jsonb),
  'ambulances', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'vehicle_code', a.vehicle_code, 'latitude', a.latitude, 'longitude', a.longitude, 'status', a.status, 'assigned_incident', a.assigned_incident, 'deployment_zone', a.deployment_zone, 'crew_size', a.crew_size, 'fuel', a.fuel, 'updated_at', a.updated_at) order by a.updated_at desc) from public.ambulances a where a.latitude between 16.45 and 16.60 and a.longitude between 80.58 and 80.73), '[]'::jsonb),
  'shelters', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'shelter_name', s.shelter_name, 'district', s.district, 'latitude', s.latitude, 'longitude', s.longitude, 'capacity', s.capacity, 'available_capacity', s.available_capacity, 'occupancy', s.occupancy, 'food_stock', s.food_stock, 'water_stock', s.water_stock, 'medical_stock', s.medical_stock, 'power_backup', s.power_backup) order by s.updated_at desc) from public.shelters s where s.district = 'NTR'), '[]'::jsonb),
  'hospitals', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'hospital_name', h.hospital_name, 'district', h.district, 'latitude', h.latitude, 'longitude', h.longitude, 'total_beds', h.total_beds, 'available_beds', h.available_beds, 'emergency_capacity', h.emergency_capacity, 'icu_beds', h.icu_beds, 'ambulances_available', h.ambulances_available) order by h.updated_at desc) from public.hospitals h where h.district = 'NTR'), '[]'::jsonb),
  'roads', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'road_name', r.road_name, 'name', r.name, 'district', r.district, 'status', r.status, 'blocked_reason', r.blocked_reason, 'travel_time', r.travel_time, 'risk_score', r.risk_score, 'road_type', r.road_type, 'start_lat', r.start_lat, 'start_lng', r.start_lng, 'end_lat', r.end_lat, 'end_lng', r.end_lng) order by r.updated_at desc) from public.roads r where r.district = 'NTR'), '[]'::jsonb)
);
$$;

create or replace function public.get_preparedness_metrics()
returns jsonb
language sql stable security definer set search_path = public
as $$
with risk as (
  select count(*) filter (where risk_level in ('high', 'critical')) as high_risk_zones
  from public.risk_zones where district = 'NTR'
), ambulances as (
  select count(*) filter (where status = 'available') as ready_ambulances
  from public.ambulances where latitude between 16.45 and 16.60 and longitude between 80.58 and 80.73
), teams as (
  select count(*) filter (where status in ('available', 'standby', 'deployed') and readiness in ('ready', 'standby')) as ready_rescue_teams
  from public.rescue_teams where latitude between 16.45 and 16.60 and longitude between 80.58 and 80.73
), shelters as (
  select coalesce(sum(available_capacity), 0) as available_shelter_capacity
  from public.shelters where district = 'NTR'
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
