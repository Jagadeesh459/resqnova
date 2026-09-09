-- Clean operational dataset reset.
-- Auth/public users remain available; all map and preparedness records are replaced.
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

insert into public.ambulances (id, vehicle_code, latitude, longitude, status, deployment_zone, crew_size, fuel) values
  ('31000000-0000-0000-0000-000000000001', 'AP-07-AM-101', 16.5170, 80.6480, 'available', 'Benz Circle', 3, 94),
  ('31000000-0000-0000-0000-000000000002', 'AP-07-AM-102', 16.5190, 80.6420, 'available', 'Railway Station', 3, 88),
  ('31000000-0000-0000-0000-000000000003', 'AP-07-AM-103', 16.5060, 80.6480, 'dispatched', 'Kanaka Durga Bridge', 2, 76),
  ('31000000-0000-0000-0000-000000000004', 'AP-07-AM-104', 16.4980, 80.6900, 'available', 'Auto Nagar', 3, 91),
  ('31000000-0000-0000-0000-000000000005', 'AP-07-AM-105', 16.5150, 80.6450, 'available', 'MG Road', 2, 86),
  ('31000000-0000-0000-0000-000000000006', 'AP-07-AM-106', 16.5450, 80.6500, 'maintenance', 'Ajit Singh Nagar', 2, 32),
  ('31000000-0000-0000-0000-000000000007', 'AP-07-AM-107', 16.5330, 80.6000, 'available', 'Bhavanipuram', 3, 97),
  ('31000000-0000-0000-0000-000000000008', 'AP-07-AM-108', 16.5260, 80.6350, 'available', 'Governorpet', 3, 90),
  ('31000000-0000-0000-0000-000000000009', 'AP-07-AM-109', 16.5100, 80.6500, 'available', 'Krishna Lanka', 2, 81),
  ('31000000-0000-0000-0000-000000000010', 'AP-07-AM-110', 16.5150, 80.6350, 'available', 'Bus Stand', 3, 93),
  ('31000000-0000-0000-0000-000000000011', 'AP-07-AM-111', 16.5193, 80.6305, 'available', 'GGH', 3, 95),
  ('31000000-0000-0000-0000-000000000012', 'AP-07-AM-112', 16.5193, 80.6305, 'dispatched', 'GGH', 2, 72),
  ('31000000-0000-0000-0000-000000000013', 'AP-07-AM-113', 16.5100, 80.6350, 'available', 'Ramesh Hospital', 3, 89),
  ('31000000-0000-0000-0000-000000000014', 'AP-07-AM-114', 16.5150, 80.6450, 'available', 'Andhra Hospital', 2, 84),
  ('31000000-0000-0000-0000-000000000015', 'AP-07-AM-115', 16.4700, 80.6900, 'available', 'Manipal Hospital', 3, 92),
  ('31000000-0000-0000-0000-000000000016', 'AP-07-AM-116', 16.5050, 80.6700, 'available', 'Patamata', 2, 79),
  ('31000000-0000-0000-0000-000000000017', 'AP-07-AM-117', 16.5330, 80.6000, 'available', 'Bhavanipuram', 2, 87),
  ('31000000-0000-0000-0000-000000000018', 'AP-07-AM-118', 16.4980, 80.6900, 'available', 'Auto Nagar', 3, 90),
  ('31000000-0000-0000-0000-000000000019', 'AP-07-AM-119', 16.5050, 80.6400, 'available', 'NTR Statue', 2, 85),
  ('31000000-0000-0000-0000-000000000020', 'AP-07-AM-120', 16.5750, 80.6100, 'available', 'Gollapudi', 3, 96);

insert into public.rescue_teams (id, team_name, leader, latitude, longitude, status, deployment_zone, team_type, personnel, equipment, readiness) values
  ('21000000-0000-0000-0000-000000000001', 'RT-Alpha', 'Meera Reddy', 16.5170, 80.6480, 'available', 'Benz Circle', 'Fire', 18, '{fire_truck,thermal_camera,rope_kit}', 'ready'),
  ('21000000-0000-0000-0000-000000000002', 'RT-Bravo', 'Kiran Rao', 16.5260, 80.6350, 'standby', 'Governorpet', 'Medical', 10, '{trauma_kit,oxygen,defibrillator}', 'ready'),
  ('21000000-0000-0000-0000-000000000003', 'RT-Charlie', 'Ravi Naidu', 16.5330, 80.6000, 'available', 'Bhavanipuram', 'SDRF', 24, '{inflatable_boat,life_jacket,drone}', 'ready'),
  ('21000000-0000-0000-0000-000000000004', 'RT-Delta', 'Anil Varma', 16.5750, 80.6100, 'available', 'Gollapudi', 'NDRF', 28, '{rescue_boat,deep_dive_kit,marine_radio}', 'ready'),
  ('21000000-0000-0000-0000-000000000005', 'RT-Echo', 'Suresh Babu', 16.5100, 80.6500, 'standby', 'Krishna Lanka', 'Boat Rescue', 12, '{rescue_boat,throw_bag,life_jacket}', 'standby'),
  ('21000000-0000-0000-0000-000000000006', 'RT-Foxtrot', 'Lakshmi Devi', 16.5193, 80.6305, 'available', 'GGH', 'Medical', 12, '{trauma_kit,oxygen,first_aid}', 'ready');

insert into public.hospitals (id, hospital_name, district, latitude, longitude, total_beds, available_beds, emergency_capacity, icu_beds, ambulances_available) values
  ('51000000-0000-0000-0000-000000000001', 'Government General Hospital', 'NTR', 16.5193, 80.6305, 850, 216, 120, 48, 3),
  ('51000000-0000-0000-0000-000000000002', 'NRI Hospital Vijayawada', 'NTR', 16.4200, 80.5600, 650, 190, 82, 36, 2),
  ('51000000-0000-0000-0000-000000000003', 'Ramesh Hospitals', 'NTR', 16.5100, 80.6350, 360, 84, 45, 22, 2),
  ('51000000-0000-0000-0000-000000000004', 'Andhra Hospital', 'NTR', 16.5150, 80.6450, 420, 96, 58, 24, 2),
  ('51000000-0000-0000-0000-000000000005', 'Manipal Hospital Vijayawada', 'NTR', 16.4700, 80.6900, 500, 142, 70, 30, 2),
  ('51000000-0000-0000-0000-000000000006', 'Sentini Hospitals', 'NTR', 16.5050, 80.6480, 300, 72, 34, 14, 1),
  ('51000000-0000-0000-0000-000000000007', 'Pinnamaneni Siddhartha Hospital', 'NTR', 16.4950, 80.6800, 280, 61, 30, 12, 1),
  ('51000000-0000-0000-0000-000000000008', 'AIIMS Mangalagiri Support Node', 'NTR', 16.4300, 80.5600, 960, 278, 150, 52, 2);

insert into public.shelters (id, shelter_name, district, latitude, longitude, capacity, available_capacity, occupancy, food_stock, water_stock, medical_stock, power_backup) values
  ('41000000-0000-0000-0000-000000000001', 'Benz Circle Community Hall', 'NTR', 16.5170, 80.6480, 500, 335, 165, 1600, 1250, 110, true),
  ('41000000-0000-0000-0000-000000000002', 'Railway Station Transit Shelter', 'NTR', 16.5190, 80.6420, 600, 420, 180, 1900, 1500, 130, true),
  ('41000000-0000-0000-0000-000000000003', 'Bhavanipuram Community Hall', 'NTR', 16.5330, 80.6000, 800, 590, 210, 2600, 2100, 220, true),
  ('41000000-0000-0000-0000-000000000004', 'Governorpet Relief Centre', 'NTR', 16.5260, 80.6350, 550, 360, 190, 1800, 1350, 130, true),
  ('41000000-0000-0000-0000-000000000005', 'Krishna Lanka Flood Shelter', 'NTR', 16.5100, 80.6500, 900, 620, 280, 3000, 2400, 260, true),
  ('41000000-0000-0000-0000-000000000006', 'Ajit Singh Nagar Shelter', 'NTR', 16.5450, 80.6500, 650, 420, 230, 2200, 1750, 150, true),
  ('41000000-0000-0000-0000-000000000007', 'Auto Nagar Industrial Shelter', 'NTR', 16.4980, 80.6900, 500, 340, 160, 1600, 1250, 100, true),
  ('41000000-0000-0000-0000-000000000008', 'Gollapudi Relief Shelter', 'NTR', 16.5750, 80.6100, 400, 285, 115, 1300, 1000, 90, true),
  ('41000000-0000-0000-0000-000000000009', 'One Town Relief Centre', 'NTR', 16.5190, 80.6250, 450, 300, 150, 1400, 1100, 100, true),
  ('41000000-0000-0000-0000-000000000010', 'Vijayawada Indoor Stadium Shelter', 'NTR', 16.5100, 80.6750, 1200, 880, 320, 4200, 3500, 300, true);

insert into public.roads (id, road_name, name, district, status, blocked_reason, travel_time, risk_score, road_type, start_lat, start_lng, end_lat, end_lng) values
  ('71000000-0000-0000-0000-000000000001', 'NH16 Benz Circle Junction', 'NH16 Benz Circle Junction', 'NTR', 'open', null, 8, 18, 'highway', 16.5170, 80.6480, 16.5200, 80.6600),
  ('71000000-0000-0000-0000-000000000002', 'MG Road', 'MG Road', 'NTR', 'open', null, 7, 21, 'arterial', 16.5150, 80.6350, 16.5170, 80.6700),
  ('71000000-0000-0000-0000-000000000003', 'Eluru Road', 'Eluru Road', 'NTR', 'open', null, 10, 29, 'arterial', 16.5300, 80.6400, 16.5500, 80.6500),
  ('71000000-0000-0000-0000-000000000004', 'Kanaka Durga Bridge', 'Kanaka Durga Bridge', 'NTR', 'restricted', 'River level monitoring', 12, 63, 'bridge', 16.5060, 80.6480, 16.4950, 80.6800),
  ('71000000-0000-0000-0000-000000000005', 'Prakasam Barrage Road', 'Prakasam Barrage Road', 'NTR', 'restricted', 'Low-lying river edge', 13, 71, 'bridge', 16.5060, 80.6480, 16.5300, 80.6200),
  ('71000000-0000-0000-0000-000000000006', 'Auto Nagar Road', 'Auto Nagar Road', 'NTR', 'open', null, 16, 34, 'arterial', 16.4980, 80.6900, 16.5250, 80.7000),
  ('71000000-0000-0000-0000-000000000007', 'Ramavarappadu Road', 'Ramavarappadu Road', 'NTR', 'open', null, 11, 26, 'arterial', 16.5200, 80.7200, 16.5400, 80.7000),
  ('71000000-0000-0000-0000-000000000008', 'Governorpet Main Road', 'Governorpet Main Road', 'NTR', 'open', null, 6, 31, 'local', 16.5260, 80.6350, 16.5190, 80.6420),
  ('71000000-0000-0000-0000-000000000009', 'Railway Station Approach', 'Railway Station Approach', 'NTR', 'open', null, 5, 22, 'local', 16.5190, 80.6420, 16.5170, 80.6480),
  ('71000000-0000-0000-0000-000000000010', 'Bhavanipuram River Edge', 'Bhavanipuram River Edge', 'NTR', 'blocked', 'Krishna backflow risk', 15, 91, 'flood_prone', 16.5330, 80.6000, 16.5200, 80.6100),
  ('71000000-0000-0000-0000-000000000011', 'Krishna Lanka Main Road', 'Krishna Lanka Main Road', 'NTR', 'restricted', 'Riverbank saturation', 12, 74, 'flood_prone', 16.5100, 80.6500, 16.4950, 80.6600),
  ('71000000-0000-0000-0000-000000000012', 'Bus Stand Approach Road', 'Bus Stand Approach Road', 'NTR', 'open', null, 6, 32, 'arterial', 16.5150, 80.6350, 16.5190, 80.6420);

insert into public.risk_zones (id, zone_name, district, risk_level, risk_score, polygon) values
  ('92000000-0000-0000-0000-000000000001', 'Krishna River Bank', 'NTR', 'critical', 95, '{"type":"Polygon","coordinates":[[[80.600,16.535],[80.640,16.535],[80.650,16.495],[80.610,16.480],[80.590,16.510],[80.600,16.535]]]}'),
  ('92000000-0000-0000-0000-000000000002', 'Kanaka Durga Bridge', 'NTR', 'high', 84, '{"type":"Polygon","coordinates":[[[80.635,16.520],[80.670,16.520],[80.670,16.495],[80.635,16.495],[80.635,16.520]]]}'),
  ('92000000-0000-0000-0000-000000000003', 'Bhavanipuram', 'NTR', 'moderate', 68, '{"type":"Polygon","coordinates":[[[80.590,16.555],[80.625,16.555],[80.625,16.520],[80.590,16.520],[80.590,16.555]]]}'),
  ('92000000-0000-0000-0000-000000000004', 'Gollapudi Drainage Zone', 'NTR', 'moderate', 58, '{"type":"Polygon","coordinates":[[[80.585,16.600],[80.630,16.600],[80.630,16.565],[80.585,16.565],[80.585,16.600]]]}'),
  ('92000000-0000-0000-0000-000000000005', 'Krishna Lanka', 'NTR', 'critical', 91, '{"type":"Polygon","coordinates":[[[80.640,16.515],[80.670,16.515],[80.670,16.490],[80.640,16.490],[80.640,16.515]]]}'),
  ('92000000-0000-0000-0000-000000000006', 'One Town Lowlands', 'NTR', 'high', 78, '{"type":"Polygon","coordinates":[[[80.615,16.530],[80.645,16.530],[80.645,16.515],[80.615,16.515],[80.615,16.530]]]}'),
  ('92000000-0000-0000-0000-000000000007', 'Auto Nagar Channel', 'NTR', 'moderate', 54, '{"type":"Polygon","coordinates":[[[80.675,16.510],[80.710,16.510],[80.710,16.480],[80.675,16.480],[80.675,16.510]]]}'),
  ('92000000-0000-0000-0000-000000000008', 'Patamata Low Point', 'NTR', 'moderate', 49, '{"type":"Polygon","coordinates":[[[80.655,16.520],[80.685,16.520],[80.685,16.495],[80.655,16.495],[80.655,16.520]]]}');

insert into public.deployment_zones (id, zone_name, district, ready_units, capacity, coverage, polygon) values
  ('aa100000-0000-0000-0000-000000000001', 'Central Vijayawada', 'NTR', 12, 15, 86, '{"type":"Polygon","coordinates":[[[80.625,16.54],[80.665,16.54],[80.665,16.50],[80.625,16.50],[80.625,16.54]]]}'),
  ('aa100000-0000-0000-0000-000000000002', 'Riverfront Sector', 'NTR', 8, 10, 73, '{"type":"Polygon","coordinates":[[[80.60,16.535],[80.64,16.535],[80.64,16.48],[80.60,16.48],[80.60,16.535]]]}'),
  ('aa100000-0000-0000-0000-000000000003', 'Patamata Sector', 'NTR', 7, 9, 68, '{"type":"Polygon","coordinates":[[[80.65,16.53],[80.70,16.53],[80.70,16.49],[80.65,16.49],[80.65,16.53]]]}'),
  ('aa100000-0000-0000-0000-000000000004', 'Auto Nagar Sector', 'NTR', 6, 8, 61, '{"type":"Polygon","coordinates":[[[80.67,16.52],[80.72,16.52],[80.72,16.47],[80.67,16.47],[80.67,16.52]]]}');

insert into public.travel_time_edges (source, destination, distance, normal_time, emergency_time, congestion_factor, road_status) values
  ('Benz Circle', 'MG Road', 2.0, 6, 4, 1.22, 'open'),
  ('MG Road', 'Governorpet', 1.5, 5, 3, 1.19, 'open'),
  ('Governorpet', 'Railway Station', 1.8, 6, 4, 1.25, 'open'),
  ('Railway Station', 'Bus Stand', 1.2, 5, 3, 1.18, 'open'),
  ('Bus Stand', 'GGH', 2.1, 7, 4, 1.28, 'open'),
  ('GGH', 'Kanaka Durga Bridge', 3.5, 12, 8, 1.42, 'partial'),
  ('Kanaka Durga Bridge', 'Auto Nagar', 5.8, 16, 11, 1.36, 'open'),
  ('Benz Circle', 'Bhavanipuram', 4.7, 14, 9, 1.48, 'partial');
