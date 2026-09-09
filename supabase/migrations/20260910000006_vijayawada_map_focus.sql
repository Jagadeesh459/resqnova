-- Focus the remote operational dataset on a compact Vijayawada command view.
-- Portal-specific navigation remains available for later citizen, ambulance, and rescue modules.

delete from public.shelters;

insert into public.shelters (id, shelter_name, district, latitude, longitude, capacity, available_capacity, occupancy, food_stock, water_stock, medical_stock, power_backup) values
  ('42000000-0000-0000-0000-000000000001', 'Benz Circle Community Hall', 'NTR', 16.5170, 80.6480, 500, 335, 165, 1600, 1250, 110, true),
  ('42000000-0000-0000-0000-000000000002', 'Railway Station Transit Shelter', 'NTR', 16.5190, 80.6420, 600, 420, 180, 1900, 1500, 130, true),
  ('42000000-0000-0000-0000-000000000003', 'Bhavanipuram Community Hall', 'NTR', 16.5330, 80.6000, 800, 590, 210, 2600, 2100, 220, true),
  ('42000000-0000-0000-0000-000000000004', 'Governorpet Relief Centre', 'NTR', 16.5260, 80.6350, 550, 360, 190, 1800, 1350, 130, true),
  ('42000000-0000-0000-0000-000000000005', 'Vijayawada Indoor Stadium Shelter', 'NTR', 16.5100, 80.6750, 1200, 880, 320, 4200, 3500, 300, true);

delete from public.risk_zones;

insert into public.risk_zones (id, zone_name, district, risk_level, risk_score, polygon) values
  ('93000000-0000-0000-0000-000000000001', 'Krishna Riverfront', 'NTR', 'critical', 95, '{"type":"Polygon","coordinates":[[[80.620,16.525],[80.642,16.525],[80.648,16.505],[80.630,16.492],[80.612,16.505],[80.620,16.525]]]}'),
  ('93000000-0000-0000-0000-000000000002', 'Kanaka Durga Approach', 'NTR', 'high', 84, '{"type":"Polygon","coordinates":[[[80.642,16.520],[80.660,16.520],[80.660,16.502],[80.642,16.502],[80.642,16.520]]]}'),
  ('93000000-0000-0000-0000-000000000003', 'Bhavanipuram Lowland', 'NTR', 'high', 73, '{"type":"Polygon","coordinates":[[[80.596,16.548],[80.616,16.548],[80.616,16.528],[80.596,16.528],[80.596,16.548]]]}'),
  ('93000000-0000-0000-0000-000000000004', 'Krishna Lanka Edge', 'NTR', 'moderate', 61, '{"type":"Polygon","coordinates":[[[80.642,16.515],[80.658,16.515],[80.658,16.500],[80.642,16.500],[80.642,16.515]]]}');

delete from public.deployment_zones;

insert into public.deployment_zones (id, zone_name, district, ready_units, capacity, coverage, polygon) values
  ('ab000000-0000-0000-0000-000000000001', 'Central Vijayawada', 'NTR', 12, 15, 86, '{"type":"Polygon","coordinates":[[[80.632,16.535],[80.665,16.535],[80.665,16.505],[80.632,16.505],[80.632,16.535]]]}'),
  ('ab000000-0000-0000-0000-000000000002', 'Riverfront Sector', 'NTR', 8, 10, 73, '{"type":"Polygon","coordinates":[[[80.608,16.535],[80.638,16.535],[80.638,16.495],[80.608,16.495],[80.608,16.535]]]}'),
  ('ab000000-0000-0000-0000-000000000003', 'East Vijayawada', 'NTR', 7, 9, 68, '{"type":"Polygon","coordinates":[[[80.665,16.530],[80.700,16.530],[80.700,16.495],[80.665,16.495],[80.665,16.530]]]}');
