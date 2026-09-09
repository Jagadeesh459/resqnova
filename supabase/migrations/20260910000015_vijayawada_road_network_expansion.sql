-- Expand the Vijayawada operational road network used by the live OSRM road layer.

insert into public.roads (id, road_name, name, district, status, blocked_reason, travel_time, risk_score, road_type, start_lat, start_lng, end_lat, end_lng) values
  ('71000000-0000-0000-0000-000000000029', 'NH65 Vijayawada West', 'NH65 Vijayawada West', 'NTR', 'open', null, 16, 22, 'highway', 16.5200, 80.6100, 16.5000, 80.5800),
  ('71000000-0000-0000-0000-000000000030', 'NH65 Ibrahimpatnam Link', 'NH65 Ibrahimpatnam Link', 'NTR', 'restricted', 'Heavy relief convoy movement', 24, 61, 'highway', 16.5000, 80.5800, 16.4700, 80.6000),
  ('71000000-0000-0000-0000-000000000031', 'Mangalagiri Bridge Approach', 'Mangalagiri Bridge Approach', 'NTR', 'open', null, 15, 27, 'arterial', 16.4700, 80.6000, 16.4700, 80.6500),
  ('71000000-0000-0000-0000-000000000032', 'Kabela Inner Road', 'Kabela Inner Road', 'NTR', 'restricted', 'Emergency staging vehicles parked', 8, 49, 'local', 16.5300, 80.6250, 16.5400, 80.6400),
  ('71000000-0000-0000-0000-000000000033', 'Ajit Singh Nagar Main Road', 'Ajit Singh Nagar Main Road', 'NTR', 'open', null, 10, 31, 'arterial', 16.5450, 80.6500, 16.5550, 80.6700),
  ('71000000-0000-0000-0000-000000000034', 'Vambay Colony Access', 'Vambay Colony Access', 'NTR', 'blocked', 'Drain overflow at colony entrance', 17, 83, 'local', 16.5450, 80.6500, 16.5500, 80.6350),
  ('71000000-0000-0000-0000-000000000035', 'Ramavarappadu Ring Road', 'Ramavarappadu Ring Road', 'NTR', 'restricted', 'Shoulder damage after waterlogging', 19, 76, 'arterial', 16.5400, 80.7000, 16.5550, 80.7200),
  ('71000000-0000-0000-0000-000000000036', 'Prasadampadu Service Road', 'Prasadampadu Service Road', 'NTR', 'open', null, 13, 25, 'local', 16.5550, 80.7200, 16.5700, 80.7300),
  ('71000000-0000-0000-0000-000000000037', 'Gunadala Church Road', 'Gunadala Church Road', 'NTR', 'open', null, 9, 30, 'local', 16.5350, 80.6650, 16.5450, 80.6800),
  ('71000000-0000-0000-0000-000000000038', 'Patamata Canal Road', 'Patamata Canal Road', 'NTR', 'restricted', 'Standing water near canal crossing', 14, 67, 'arterial', 16.5050, 80.6700, 16.5150, 80.6900),
  ('71000000-0000-0000-0000-000000000039', 'Moghalrajpuram Hill Road', 'Moghalrajpuram Hill Road', 'NTR', 'open', null, 10, 18, 'arterial', 16.5200, 80.6500, 16.5350, 80.6600),
  ('71000000-0000-0000-0000-000000000040', 'Suryaraopet Hospital Link', 'Suryaraopet Hospital Link', 'NTR', 'open', null, 5, 16, 'local', 16.5190, 80.6420, 16.5100, 80.6350)
on conflict (id) do update set status = excluded.status, blocked_reason = excluded.blocked_reason, travel_time = excluded.travel_time, risk_score = excluded.risk_score, updated_at = now();

insert into public.alerts (id, title, description, severity, district) values
  ('a1000000-0000-0000-0000-000000000017', 'Vambay Colony access blocked', 'Drain overflow is blocking the colony entrance. Rescue access is being coordinated.', 'warning', 'NTR'),
  ('a1000000-0000-0000-0000-000000000018', 'NH65 relief convoy', 'Emergency convoy movement may increase travel time on the west corridor.', 'info', 'NTR'),
  ('a1000000-0000-0000-0000-000000000019', 'Patamata canal waterlogging', 'Use the hospital link or MG Road approach for medical movement.', 'warning', 'NTR'),
  ('a1000000-0000-0000-0000-000000000020', 'Suryaraopet hospital link open', 'Hospital access remains clear for dispatched ambulances.', 'info', 'NTR'),
  ('a1000000-0000-0000-0000-000000000021', 'Gollapudi bund inspection', 'Riverbank inspection has restricted non-emergency movement.', 'warning', 'NTR'),
  ('a1000000-0000-0000-0000-000000000022', 'Central Vijayawada command update', 'Operational resources are receiving live assignments from the authority queue.', 'info', 'NTR'),
  ('a1000000-0000-0000-0000-000000000023', 'Krishna Lanka evacuation watch', 'Low-lying lanes remain under critical flood monitoring.', 'critical', 'NTR'),
  ('a1000000-0000-0000-0000-000000000024', 'Auto Nagar staging active', 'Emergency staging is active near the industrial shelter corridor.', 'info', 'NTR')
on conflict (id) do update set title = excluded.title, description = excluded.description, severity = excluded.severity;
