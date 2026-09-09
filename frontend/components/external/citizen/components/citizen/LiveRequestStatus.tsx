import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, Clock3, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type RequestStatus = { request_id: string; status: string; risk_level: string; priority_score: number; eta: string | null; rescue_team_id: string | null; ambulance_id: string | null };

export const LiveRequestStatus: React.FC = () => {
  const [request, setRequest] = useState<RequestStatus | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!profile) return;
      const { data } = await supabase.from('citizen_requests').select('request_id,status,risk_level,priority_score,eta,rescue_team_id,ambulance_id').eq('citizen_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (active) setRequest(data as RequestStatus | null);
    };
    void load();
    const channel = supabase.channel(`citizen-status-${Date.now()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_requests' }, () => { void load(); }).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  if (!request) return null;
  const assigned = Boolean(request.rescue_team_id || request.ambulance_id);
  return <div className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-7xl rounded-xl border border-[#00d4ff]/30 bg-[#0b1f36]/95 px-4 py-3 text-xs shadow-[0_0_20px_rgba(0,212,255,0.15)]"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[#7ce2fe]"><Activity className="h-4 w-4 animate-pulse" /><span className="font-bold">{request.request_id}</span><span className="text-[#8eadc7]">Your request is {request.status.replace('_', ' ')}</span></div><div className="flex items-center gap-3 font-mono text-[#d8e3f7]"><span className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5 text-[#ffb4ab]" />{request.risk_level}</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-[#00d4ff]" />{request.eta ? new Date(request.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ETA pending'}</span><span className="flex items-center gap-1 text-[#4ae183]"><CheckCircle className="h-3.5 w-3.5" />{assigned ? 'Responder assigned' : 'Analyzing'}</span></div></div></div>;
};
