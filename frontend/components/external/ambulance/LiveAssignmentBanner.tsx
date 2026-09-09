"use client";

import { Activity, MapPin, Siren } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Assignment = { vehicle_code: string; status: string; deployment_zone: string | null; assigned_request_id: string | null; citizen_requests?: { request_id: string; emergency_type: string; people_count: number; risk_level: string; latitude: number; longitude: number } | null };

export function LiveAssignmentBanner() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('ambulances').select('vehicle_code,status,deployment_zone,assigned_request_id,citizen_requests:assigned_request_id(request_id,emergency_type,people_count,risk_level,latitude,longitude)').or(`manager_auth_id.eq.${user.id},manager_auth_id.is.null`).order('assigned_request_id', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (active) setAssignment(data as unknown as Assignment | null);
    };
    void load();
    const channel = supabase.channel(`ambulance-assignment-${Date.now()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, () => { void load(); }).on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_requests' }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  if (!assignment?.assigned_request_id || !assignment.citizen_requests) return null;
  const request = assignment.citizen_requests;
  return <div className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-[1440px] rounded-xl border border-[#00D4FF]/30 bg-[#0B1F36]/95 px-4 py-3 text-xs shadow-[0_0_20px_rgba(0,212,255,0.15)]"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[#7ce2fe]"><Activity className="h-4 w-4 animate-pulse" /><span className="font-bold">{assignment.vehicle_code}</span><span className="text-[#8EADC7]">LIVE DISPATCH</span></div><div className="flex flex-wrap items-center gap-3 font-mono text-[#E6F4FA]"><span className="flex items-center gap-1"><Siren className="h-3.5 w-3.5 text-[#ff4d4d]" />{request.request_id} / {request.emergency_type}</span><span>{request.people_count} people / {request.risk_level}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#00D4FF]" />{request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}</span></div></div></div>;
}
