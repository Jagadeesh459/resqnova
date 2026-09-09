create or replace function public.get_public_map_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select jsonb_build_object(
  'incidents', coalesce((select jsonb_agg(jsonb_build_object(
    'id', i.id,
    'title', i.title,
    'disaster_type', i.disaster_type,
    'latitude', i.latitude,
    'longitude', i.longitude,
    'district', i.district,
    'priority', i.priority,
    'confidence', i.confidence,
    'status', i.status,
    'assigned_rescue_team', i.assigned_rescue_team,
    'assigned_ambulance', i.assigned_ambulance,
    'assigned_hospital', i.assigned_hospital,
    'assigned_shelter', i.assigned_shelter
  ) order by i.created_at desc) from public.incidents i), '[]'::jsonb),
  'rescueTeams', coalesce((select jsonb_agg(jsonb_build_object(
    'id', t.id,
    'team_name', t.team_name,
    'leader', t.leader,
    'latitude', t.latitude,
    'longitude', t.longitude,
    'status', t.status,
    'assigned_incident', t.assigned_incident
  ) order by t.updated_at desc) from public.rescue_teams t), '[]'::jsonb),
  'ambulances', coalesce((select jsonb_agg(jsonb_build_object(
    'id', a.id,
    'vehicle_code', a.vehicle_code,
    'latitude', a.latitude,
    'longitude', a.longitude,
    'status', a.status,
    'assigned_incident', a.assigned_incident
  ) order by a.updated_at desc) from public.ambulances a), '[]'::jsonb),
  'shelters', coalesce((select jsonb_agg(jsonb_build_object(
    'id', s.id,
    'shelter_name', s.shelter_name,
    'district', s.district,
    'latitude', s.latitude,
    'longitude', s.longitude,
    'capacity', s.capacity,
    'available_capacity', s.available_capacity,
    'food_stock', s.food_stock,
    'medical_stock', s.medical_stock
  ) order by s.updated_at desc) from public.shelters s), '[]'::jsonb),
  'hospitals', coalesce((select jsonb_agg(jsonb_build_object(
    'id', h.id,
    'hospital_name', h.hospital_name,
    'district', h.district,
    'latitude', h.latitude,
    'longitude', h.longitude,
    'total_beds', h.total_beds,
    'available_beds', h.available_beds,
    'emergency_capacity', h.emergency_capacity
  ) order by h.updated_at desc) from public.hospitals h), '[]'::jsonb),
  'roads', coalesce((select jsonb_agg(jsonb_build_object(
    'id', r.id,
    'road_name', r.road_name,
    'district', r.district,
    'status', r.status,
    'blocked_reason', r.blocked_reason
  ) order by r.updated_at desc) from public.roads r), '[]'::jsonb)
);
$$;

grant execute on function public.get_public_map_data() to anon, authenticated;
