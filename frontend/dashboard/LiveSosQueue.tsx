"use client";

import { useEffect, useState } from "react";
import { Activity, Ambulance, CheckCircle2, Clock3, ShieldAlert, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";

type LiveRequest = {
  id: string;
  request_id: string;
  emergency_type: string;
  people_count: number;
  risk_level: string;
  priority_score: number;
  ai_confidence: number;
  status: string;
  ai_stage: string;
  rescue_team_id: string | null;
  ambulance_id: string | null;
  created_at: string;
};

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function LiveSosQueue() {
  const [requests, setRequests] = useState<LiveRequest[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase
        .from("citizen_requests")
        .select("id,request_id,emergency_type,people_count,risk_level,priority_score,ai_confidence,status,ai_stage,rescue_team_id,ambulance_id,created_at")
        .not("status", "in", "(resolved,cancelled)")
        .order("priority_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (active) setRequests((data ?? []) as LiveRequest[]);
    };
    void load();
    const channel = supabase
      .channel(`dashboard-sos-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "citizen_requests" }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_execution_logs" }, () => { void load(); })
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  return <GlassCard className="p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-danger/25 bg-danger/10 p-2 text-danger"><Activity className="h-4 w-4" /></div>
        <div><p className="text-xs uppercase tracking-[0.24em] text-danger">Live SOS Queue</p><p className="mt-1 text-sm text-text/55">Supabase requests ordered by AI priority</p></div>
      </div>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{requests.length} active</span>
    </div>
    {requests.length === 0 ? <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-text/55">No active SOS requests.</p> : <div className="mt-4 grid gap-2 lg:grid-cols-2">{requests.map((request) => <div key={request.id} className="rounded-xl border border-white/10 bg-background/35 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-primary">{request.request_id}</p><p className="mt-1 text-sm font-semibold capitalize text-text">{statusLabel(request.emergency_type)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-mono uppercase ${request.risk_level === "critical" ? "bg-danger/15 text-danger" : request.risk_level === "high" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}>{request.risk_level}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-text/55"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{request.people_count} people</span><span className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5 text-danger" />{Math.round(request.priority_score)} priority</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />AI {Math.round(request.ai_confidence)}%</span><span className="flex items-center gap-1">{request.rescue_team_id ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Ambulance className="h-3.5 w-3.5 text-warning" />}{request.rescue_team_id || request.ambulance_id ? "Assigned" : statusLabel(request.ai_stage)}</span></div></div>)}</div>}
  </GlassCard>;
}
