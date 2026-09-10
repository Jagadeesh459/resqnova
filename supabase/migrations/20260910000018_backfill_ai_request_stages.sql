-- Prevent historical requests from being picked up as newly received SOS events.

update public.citizen_requests
set ai_stage = case
  when status in ('resolved', 'cancelled') then 'resolved'
  when status in ('assigned', 'en_route', 'on_scene') then 'notified'
  else ai_stage
end
where ai_stage = 'received';
