-- Additional Vijayawada-only operational roads, closures, alerts, and risk zones.
-- Road geometry is resolved from each stored endpoint through the map routing layer.

insert into public.roads (id, road_name, name, district, status, blocked_reason, travel_time, risk_score, road_type, start_lat, start_lng, end_lat, end_lng) values
  ('71000000-0000-0000-0000-000000000013', 'NH16 Ramavarappadu Interchange', 'NH16 Ramavarappadu Interchange', 'NTR', 'blocked', 'Flooded shoulder and fallen tree clearance', 22, 92, 'highway', 16.5200, 80.7200, 16.5500, 80.7300),
  ('71000000-0000-0000-0000-000000000014', 'Benz Circle Flyover Approach', 'Benz Circle Flyover Approach', 'NTR', 'blocked', 'Junction submerged under 0.6m water', 18, 88, 'arterial', 16.5170, 80.6480, 16.5050, 80.6550),
  ('71000000-0000-0000-0000-000000000015', 'Eluru Road Canal Link', 'Eluru Road Canal Link', 'NTR', 'blocked', 'Drain overflow and debris on carriageway', 19, 86, 'arterial', 16.5300, 80.6400, 16.5350, 80.6200),
  ('71000000-0000-0000-0000-000000000016', 'MG Road Central Section', 'MG Road Central Section', 'NTR', 'restricted', 'Slow traffic near relief staging point', 11, 58, 'arterial', 16.5150, 80.6450, 16.5200, 80.6650),
  ('71000000-0000-0000-0000-000000000017', 'Auto Nagar East Link', 'Auto Nagar East Link', 'NTR', 'restricted', 'Waterlogging at industrial access gate', 17, 64, 'arterial', 16.4980, 80.6900, 16.5050, 80.7150),
  ('71000000-0000-0000-0000-000000000018', 'Gollapudi Bund Road', 'Gollapudi Bund Road', 'NTR', 'blocked', 'Riverbank erosion inspection underway', 21, 89, 'flood_prone', 16.5750, 80.6100, 16.5550, 80.6200),
  ('71000000-0000-0000-0000-000000000019', 'Bhavanipuram Main Road', 'Bhavanipuram Main Road', 'NTR', 'restricted', 'Emergency vehicle-only corridor', 13, 72, 'arterial', 16.5330, 80.6000, 16.5450, 80.6200),
  ('71000000-0000-0000-0000-000000000020', 'Krishna Lanka East Road', 'Krishna Lanka East Road', 'NTR', 'blocked', 'River surge across low section', 16, 94, 'flood_prone', 16.5100, 80.6500, 16.5050, 80.6700),
  ('71000000-0000-0000-0000-000000000021', 'Governorpet Collectorate Link', 'Governorpet Collectorate Link', 'NTR', 'open', null, 7, 24, 'local', 16.5260, 80.6350, 16.5200, 80.6250),
  ('71000000-0000-0000-0000-000000000022', 'Railway Station West Approach', 'Railway Station West Approach', 'NTR', 'open', null, 6, 19, 'local', 16.5190, 80.6420, 16.5200, 80.6250),
  ('71000000-0000-0000-0000-000000000023', 'Bus Stand Bandar Road', 'Bus Stand Bandar Road', 'NTR', 'restricted', 'Relief convoy movement', 10, 55, 'arterial', 16.5150, 80.6350, 16.5050, 80.6400),
  ('71000000-0000-0000-0000-000000000024', 'Prakasam Barrage North Bank', 'Prakasam Barrage North Bank', 'NTR', 'blocked', 'Barrage safety closure', 20, 97, 'bridge', 16.5060, 80.6480, 16.5150, 80.6150),
  ('71000000-0000-0000-0000-000000000025', 'Patamata Ring Road', 'Patamata Ring Road', 'NTR', 'open', null, 12, 28, 'arterial', 16.5050, 80.6700, 16.5200, 80.7000),
  ('71000000-0000-0000-0000-000000000026', 'Airport Road South', 'Airport Road South', 'NTR', 'open', null, 18, 17, 'highway', 16.5200, 80.7200, 16.4700, 80.7300),
  ('71000000-0000-0000-0000-000000000027', 'Poranki Relief Corridor', 'Poranki Relief Corridor', 'NTR', 'open', null, 14, 23, 'arterial', 16.4700, 80.6900, 16.4800, 80.7200),
  ('71000000-0000-0000-0000-000000000028', 'NTR Circle Emergency Link', 'NTR Circle Emergency Link', 'NTR', 'restricted', 'Police-controlled movement', 9, 51, 'local', 16.5100, 80.6350, 16.5170, 80.6480)
on conflict (id) do update set status = excluded.status, blocked_reason = excluded.blocked_reason, travel_time = excluded.travel_time, risk_score = excluded.risk_score, updated_at = now();

insert into public.alerts (id, title, description, severity, district) values
  ('a1000000-0000-0000-0000-000000000011', 'Kanaka Durga Bridge closure', 'Bridge access is closed to civilian traffic. Use approved emergency corridors only.', 'critical', 'NTR'),
  ('a1000000-0000-0000-0000-000000000012', 'Benz Circle flooding', 'Junction waterlogging is affecting normal traffic and ambulance approach times.', 'critical', 'NTR'),
  ('a1000000-0000-0000-0000-000000000013', 'Eluru Road debris', 'Drain overflow has left debris on the canal link. Rescue access is restricted.', 'warning', 'NTR'),
  ('a1000000-0000-0000-0000-000000000014', 'Krishna Lanka river surge', 'River level is rising near low-lying residential lanes.', 'critical', 'NTR'),
  ('a1000000-0000-0000-0000-000000000015', 'Ramavarappadu tree fall', 'NH16 shoulder clearance is in progress; use the alternate city approach.', 'warning', 'NTR'),
  ('a1000000-0000-0000-0000-000000000016', 'Auto Nagar restricted access', 'Industrial access is limited to emergency and relief vehicles.', 'warning', 'NTR')
on conflict (id) do update set title = excluded.title, description = excluded.description, severity = excluded.severity;

insert into public.risk_zones (id, zone_name, district, risk_level, risk_score, polygon) values
  ('92000000-0000-0000-0000-000000000009', 'Ramavarappadu Lowlands', 'NTR', 'high', 82, '{"type":"Polygon","coordinates":[[[80.705,16.545],[80.735,16.545],[80.735,16.515],[80.705,16.515],[80.705,16.545]]]}'),
  ('92000000-0000-0000-0000-000000000010', 'Benz Circle Junction', 'NTR', 'moderate', 62, '{"type":"Polygon","coordinates":[[[80.640,16.525],[80.660,16.525],[80.660,16.505],[80.640,16.505],[80.640,16.525]]]}'),
  ('92000000-0000-0000-0000-000000000011', 'Auto Nagar Channel', 'NTR', 'moderate', 59, '{"type":"Polygon","coordinates":[[[80.680,16.515],[80.715,16.515],[80.715,16.485],[80.680,16.485],[80.680,16.515]]]}')
on conflict (id) do update set risk_level = excluded.risk_level, risk_score = excluded.risk_score, polygon = excluded.polygon;
