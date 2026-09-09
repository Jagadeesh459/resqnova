-- ResQNova demo seed: Vijayawada operational dataset only.

delete from public.incidents;
delete from public.rescue_teams;
delete from public.ambulances;
delete from public.shelters;
delete from public.hospitals;
delete from public.roads;
delete from public.alerts;
delete from public.forecast_scenarios;
delete from public.risk_zones;
delete from public.deployment_zones;
delete from public.travel_time_edges;
delete from public.users;

insert into public.users (id, full_name, email, phone, role, district) values
  ('10000000-0000-0000-0000-000000000001', 'ResQNova Administrator', 'admin@resqnova.demo', '+91 90000 00001', 'admin', 'NTR'),
  ('10000000-0000-0000-0000-000000000002', 'Vijayawada Control Officer', 'control@resqnova.demo', '+91 90000 00002', 'rescue', 'NTR'),
  ('10000000-0000-0000-0000-000000000003', 'Vijayawada Ambulance Desk', 'ambulance@resqnova.demo', '+91 90000 00003', 'ambulance', 'NTR'),
  ('10000000-0000-0000-0000-000000000004', 'Vijayawada Shelter Coordinator', 'shelter@resqnova.demo', '+91 90000 00004', 'shelter', 'NTR'),
  ('10000000-0000-0000-0000-000000000005', 'Vijayawada Citizen Demo', 'citizen@resqnova.demo', '+91 90000 00005', 'citizen', 'NTR');

insert into public.ambulances (id, vehicle_code, latitude, longitude, status, deployment_zone, crew_size, fuel)
select gen_random_uuid(), format('AP-07-AM-%s', 100 + n),
  (array[16.517,16.519,16.506,16.498,16.515,16.545,16.533,16.526,16.510,16.515,16.5193,16.5193,16.510,16.515,16.470,16.505,16.533,16.498,16.505,16.575])[n],
  (array[80.648,80.642,80.648,80.690,80.645,80.650,80.600,80.635,80.650,80.635,80.6305,80.6305,80.635,80.645,80.690,80.670,80.600,80.690,80.640,80.610])[n],
  (array['available','available','dispatched','available','available','maintenance','available','available','available','available','available','dispatched','available','available','available','available','available','available','available','available'])[n],
  (array['Benz Circle','Railway Station','Kanaka Durga Bridge','Auto Nagar','MG Road','Ajit Singh Nagar','Bhavanipuram','Governorpet','Krishna Lanka','Bus Stand','GGH','GGH','Ramesh Hospital','Andhra Hospital','Manipal Hospital','Patamata','Bhavanipuram','Auto Nagar','NTR Statue','Gollapudi'])[n],
  case when n % 3 = 0 then 3 else 2 end, 70 + (n * 7 % 28)
from generate_series(1, 20) as series(n);

insert into public.rescue_teams (id, team_name, leader, latitude, longitude, status, deployment_zone, team_type, personnel, equipment, readiness) values
  (gen_random_uuid(), 'RT-Alpha', 'Meera Reddy', 16.517, 80.648, 'available', 'Benz Circle', 'Fire', 18, '{fire_truck,thermal_camera,rope_kit}', 'ready'),
  (gen_random_uuid(), 'RT-Bravo', 'Kiran Rao', 16.526, 80.635, 'standby', 'Governorpet', 'Medical', 10, '{trauma_kit,oxygen,defibrillator}', 'ready'),
  (gen_random_uuid(), 'RT-Charlie', 'Ravi Naidu', 16.533, 80.600, 'available', 'Bhavanipuram', 'SDRF', 24, '{inflatable_boat,life_jacket,drone}', 'ready'),
  (gen_random_uuid(), 'RT-Delta', 'Anil Varma', 16.575, 80.610, 'available', 'Gollapudi', 'NDRF', 28, '{rescue_boat,deep_dive_kit,marine_radio}', 'ready'),
  (gen_random_uuid(), 'RT-Echo', 'Suresh Babu', 16.510, 80.650, 'standby', 'Krishna Lanka', 'Boat Rescue', 12, '{rescue_boat,throw_bag,life_jacket}', 'standby'),
  (gen_random_uuid(), 'RT-Foxtrot', 'Lakshmi Devi', 16.5193, 80.6305, 'available', 'GGH', 'Medical', 12, '{trauma_kit,oxygen,first_aid}', 'ready');

insert into public.hospitals (id, hospital_name, district, latitude, longitude, total_beds, available_beds, emergency_capacity, icu_beds, ambulances_available) values
  (gen_random_uuid(), 'Government General Hospital', 'NTR', 16.5193, 80.6305, 850, 216, 120, 48, 3),
  (gen_random_uuid(), 'NRI Hospital Vijayawada', 'NTR', 16.560, 80.620, 650, 190, 82, 36, 2),
  (gen_random_uuid(), 'Ramesh Hospitals', 'NTR', 16.510, 80.635, 360, 84, 45, 22, 2),
  (gen_random_uuid(), 'Andhra Hospital', 'NTR', 16.515, 80.645, 420, 96, 58, 24, 2),
  (gen_random_uuid(), 'Manipal Hospital Vijayawada', 'NTR', 16.470, 80.690, 500, 142, 70, 30, 2),
  (gen_random_uuid(), 'Sentini Hospitals', 'NTR', 16.505, 80.648, 300, 72, 34, 14, 1),
  (gen_random_uuid(), 'Pinnamaneni Siddhartha Hospital', 'NTR', 16.495, 80.680, 280, 61, 30, 12, 1),
  (gen_random_uuid(), 'AIIMS Mangalagiri Support Node', 'NTR', 16.560, 80.620, 960, 278, 150, 52, 2);

insert into public.shelters (id, shelter_name, district, latitude, longitude, capacity, available_capacity, occupancy, food_stock, water_stock, medical_stock, power_backup) values
  (gen_random_uuid(), 'Benz Circle Community Hall', 'NTR', 16.517, 80.648, 500, 335, 165, 1600, 1250, 110, true),
  (gen_random_uuid(), 'Railway Station Transit Shelter', 'NTR', 16.519, 80.642, 600, 420, 180, 1900, 1500, 130, true),
  (gen_random_uuid(), 'Bhavanipuram Community Hall', 'NTR', 16.533, 80.600, 800, 590, 210, 2600, 2100, 220, true),
  (gen_random_uuid(), 'Governorpet Relief Centre', 'NTR', 16.526, 80.635, 550, 360, 190, 1800, 1350, 130, true),
  (gen_random_uuid(), 'Vijayawada Indoor Stadium Shelter', 'NTR', 16.510, 80.675, 1200, 880, 320, 4200, 3500, 300, true);

insert into public.roads (id, road_name, name, district, status, blocked_reason, travel_time, risk_score, road_type, start_lat, start_lng, end_lat, end_lng) values
  (gen_random_uuid(), 'NH16 Benz Circle Junction', 'NH16 Benz Circle Junction', 'NTR', 'open', null, 8, 18, 'highway', 16.517, 80.648, 16.520, 80.660),
  (gen_random_uuid(), 'MG Road', 'MG Road', 'NTR', 'open', null, 7, 21, 'arterial', 16.515, 80.635, 16.517, 80.670),
  (gen_random_uuid(), 'Eluru Road', 'Eluru Road', 'NTR', 'open', null, 10, 29, 'arterial', 16.530, 80.640, 16.550, 80.650),
  (gen_random_uuid(), 'Kanaka Durga Bridge', 'Kanaka Durga Bridge', 'NTR', 'restricted', 'River level monitoring', 12, 63, 'bridge', 16.506, 80.648, 16.495, 80.680),
  (gen_random_uuid(), 'Prakasam Barrage Road', 'Prakasam Barrage Road', 'NTR', 'restricted', 'Low-lying river edge', 13, 71, 'bridge', 16.506, 80.648, 16.530, 80.620),
  (gen_random_uuid(), 'Auto Nagar Road', 'Auto Nagar Road', 'NTR', 'open', null, 16, 34, 'arterial', 16.498, 80.690, 16.525, 80.700),
  (gen_random_uuid(), 'Ramavarappadu Road', 'Ramavarappadu Road', 'NTR', 'open', null, 11, 26, 'arterial', 16.520, 80.720, 16.540, 80.700),
  (gen_random_uuid(), 'Governorpet Main Road', 'Governorpet Main Road', 'NTR', 'open', null, 6, 31, 'local', 16.526, 80.635, 16.519, 80.642),
  (gen_random_uuid(), 'Railway Station Approach', 'Railway Station Approach', 'NTR', 'open', null, 5, 22, 'local', 16.519, 80.642, 16.517, 80.648),
  (gen_random_uuid(), 'Bhavanipuram River Edge', 'Bhavanipuram River Edge', 'NTR', 'blocked', 'Krishna backflow risk', 15, 91, 'flood_prone', 16.533, 80.600, 16.520, 80.610),
  (gen_random_uuid(), 'Krishna Lanka Main Road', 'Krishna Lanka Main Road', 'NTR', 'restricted', 'Riverbank saturation', 12, 74, 'flood_prone', 16.510, 80.650, 16.495, 80.660),
  (gen_random_uuid(), 'Bus Stand Approach Road', 'Bus Stand Approach Road', 'NTR', 'open', null, 6, 32, 'arterial', 16.515, 80.635, 16.519, 80.642);

insert into public.risk_zones (id, zone_name, district, risk_level, risk_score, polygon) values
  (gen_random_uuid(), 'Krishna Riverfront', 'NTR', 'critical', 95, '{"type":"Polygon","coordinates":[[[80.620,16.525],[80.642,16.525],[80.648,16.505],[80.630,16.492],[80.612,16.505],[80.620,16.525]]]}'),
  (gen_random_uuid(), 'Kanaka Durga Approach', 'NTR', 'high', 84, '{"type":"Polygon","coordinates":[[[80.642,16.520],[80.660,16.520],[80.660,16.502],[80.642,16.502],[80.642,16.520]]]}'),
  (gen_random_uuid(), 'Bhavanipuram Lowland', 'NTR', 'high', 73, '{"type":"Polygon","coordinates":[[[80.596,16.548],[80.616,16.548],[80.616,16.528],[80.596,16.528],[80.596,16.548]]]}'),
  (gen_random_uuid(), 'Krishna Lanka Edge', 'NTR', 'moderate', 61, '{"type":"Polygon","coordinates":[[[80.642,16.515],[80.658,16.515],[80.658,16.500],[80.642,16.500],[80.642,16.515]]]}');

insert into public.deployment_zones (id, zone_name, district, ready_units, capacity, coverage, polygon) values
  (gen_random_uuid(), 'Central Vijayawada', 'NTR', 12, 15, 86, '{"type":"Polygon","coordinates":[[[80.632,16.535],[80.665,16.535],[80.665,16.505],[80.632,16.505],[80.632,16.535]]]}'),
  (gen_random_uuid(), 'Riverfront Sector', 'NTR', 8, 10, 73, '{"type":"Polygon","coordinates":[[[80.608,16.535],[80.638,16.535],[80.638,16.495],[80.608,16.495],[80.608,16.535]]]}'),
  (gen_random_uuid(), 'East Vijayawada', 'NTR', 7, 9, 68, '{"type":"Polygon","coordinates":[[[80.665,16.530],[80.700,16.530],[80.700,16.495],[80.665,16.495],[80.665,16.530]]]}');

insert into public.travel_time_edges (source, destination, distance, normal_time, emergency_time, congestion_factor, road_status) values
  ('Benz Circle', 'MG Road', 2.0, 6, 4, 1.22, 'open'),
  ('MG Road', 'Governorpet', 1.5, 5, 3, 1.19, 'open'),
  ('Governorpet', 'Railway Station', 1.8, 6, 4, 1.25, 'open'),
  ('Railway Station', 'Bus Stand', 1.2, 5, 3, 1.18, 'open'),
  ('Bus Stand', 'GGH', 2.1, 7, 4, 1.28, 'open'),
  ('GGH', 'Kanaka Durga Bridge', 3.5, 12, 8, 1.42, 'partial'),
  ('Kanaka Durga Bridge', 'Auto Nagar', 5.8, 16, 11, 1.36, 'open'),
  ('Benz Circle', 'Bhavanipuram', 4.7, 14, 9, 1.48, 'partial');
