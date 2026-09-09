-- Dedicated Vijayawada rescue staging teams for the live operational map.

insert into public.rescue_teams (id, team_name, leader, latitude, longitude, status, deployment_zone, team_type, personnel, equipment, readiness, updated_at) values
  ('21000000-0000-0000-0000-000000000007', 'RT-Golf', 'Arjun Kumar', 16.5150, 80.6350, 'available', 'Bus Stand', 'SDRF', 16, '{inflatable_boat,rope_kit,life_jacket}', 'ready', now()),
  ('21000000-0000-0000-0000-000000000008', 'RT-Hotel', 'Priya Menon', 16.5050, 80.6700, 'available', 'Patamata', 'Fire', 20, '{fire_truck,hydraulic_cutter,thermal_camera}', 'ready', now()),
  ('21000000-0000-0000-0000-000000000009', 'RT-India', 'Vamsi Krishna', 16.4980, 80.6900, 'standby', 'Auto Nagar', 'NDRF', 26, '{rescue_boat,drone,deep_dive_kit}', 'standby', now()),
  ('21000000-0000-0000-0000-000000000010', 'RT-Juliet', 'Farah Begum', 16.5450, 80.6500, 'available', 'Ajit Singh Nagar', 'Medical', 11, '{trauma_kit,oxygen,defibrillator}', 'ready', now()),
  ('21000000-0000-0000-0000-000000000011', 'RT-Kilo', 'Rohit Varma', 16.5200, 80.6250, 'available', 'One Town', 'Boat Rescue', 14, '{rescue_boat,throw_bag,life_jacket}', 'ready', now()),
  ('21000000-0000-0000-0000-000000000012', 'RT-Lima', 'Nandini Rao', 16.5350, 80.6650, 'available', 'Gunadala', 'Fire', 18, '{fire_truck,rope_kit,first_aid}', 'ready', now()),
  ('21000000-0000-0000-0000-000000000013', 'RT-Mike', 'Sanjay Teja', 16.4700, 80.6900, 'standby', 'Poranki', 'SDRF', 15, '{inflatable_boat,drone,medical_kit}', 'standby', now()),
  ('21000000-0000-0000-0000-000000000014', 'RT-November', 'Keerthi Das', 16.5100, 80.6400, 'available', 'NTR Circle', 'Medical', 12, '{oxygen,trauma_kit,first_aid}', 'ready', now())
on conflict (id) do update set team_name = excluded.team_name, leader = excluded.leader, latitude = excluded.latitude, longitude = excluded.longitude, status = excluded.status, deployment_zone = excluded.deployment_zone, team_type = excluded.team_type, personnel = excluded.personnel, equipment = excluded.equipment, readiness = excluded.readiness, updated_at = now();
