"use client";

import { Activity, Filter, MapPin, Search, ShieldAlert, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { subscribeToMapChanges } from "@/lib/map/data";

type RequestRow = {
  id: string; request_id: string; latitude: number; longitude: number;
  people_count: number; emergency_type: string; risk_level: string;
  ai_confidence: number; priority_score: number; ai_reason: string | null; ai_recommendation: string | null; dispatch_source: string | null; status: string;
  eta: string | null; created_at: string;
};
type MissionRow = {
  id: string; request_id: string; mission_status: string;
  readiness: string; last_updated: string;
};
const statuses = ["all", "pending", "assigned", "en_route", "on_scene", "resolved"];

export function IntelligencePanel() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const supabase = createClient();
        const [{ data: requestData, error: requestError }, { data: missionData, error: missionError }] = await Promise.all([
          supabase.from("citizen_requests").select("id,request_id,latitude,longitude,people_count,emergency_type,risk_level,ai_confidence,priority_score,ai_reason,ai_recommendation,dispatch_source,status,eta,created_at").not("status", "in", "(resolved,cancelled)").order("priority_score", { ascending: false }).order("created_at", { ascending: false }).limit(20),
          supabase.from("rescue_missions").select("id,request_id,mission_status,readiness,last_updated").order("last_updated", { ascending: false }).limit(8),
        ]);
        if (requestError) throw requestError;
        if (missionError) throw missionError;
        if (!active) return;
        setRequests((requestData ?? []) as RequestRow[]);
        setMissions((missionData ?? []) as MissionRow[]);
        setError(false);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const unsubscribe = subscribeToMapChanges(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesStatus = status === "all" || request.status === status;
    const haystack = `${request.request_id} ${request.emergency_type} ${request.risk_level}`.toLowerCase();
    return matchesStatus && haystack.includes(search.toLowerCase());
  }), [requests, search, status]);

  return <div className="space-y-4">
    <GlassCard className="p-4">
      <PanelHeading title="Emergency Alerts" subtitle="Vijayawada citizen signal triage"><ShieldAlert className="h-5 w-5 text-danger" /></PanelHeading>
      {loading ? <LoadingRows /> : error ? <EmptyState message="Live request feed unavailable. Check Supabase connectivity." tone="warning" /> : requests.length === 0 ? <EmptyState message="No citizen SOS requests have been received." /> : <div className="space-y-2">{requests.slice(0, 3).map((request) => <div key={request.id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><span className={`h-2 w-2 shrink-0 rounded-full ${riskDot(request.risk_level)} shadow-[0_0_12px_currentColor]`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text">{request.emergency_type}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-text/50"><MapPin className="h-3 w-3" />{request.request_id}</p></div><span className="text-[9px] uppercase tracking-[0.16em] text-primary">{request.status.replace("_", " ")}</span></div>)}</div>}
    </GlassCard>

    <GlassCard className="p-4"><PanelHeading title="Gemini Recommendation" subtitle="AI dispatch decision from the active priority request"><Sparkles className="h-5 w-5 text-primary" /></PanelHeading>{requests[0] ? <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs"><div className="flex items-center justify-between gap-3"><p className="font-mono text-primary">{requests[0].request_id}</p><StatusBadge tone={riskTone(requests[0].risk_level)}>{requests[0].risk_level} / {Math.round(requests[0].ai_confidence)}%</StatusBadge></div><p className="mt-3 text-text/80">{requests[0].ai_reason ?? "AI assessment is processing."}</p><p className="mt-2 text-text/55">{requests[0].ai_recommendation ?? "No recommendation stored yet."}</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-primary/70">Source: {requests[0].dispatch_source?.replace("_", " ") ?? "pending"}</p></div> : <EmptyState message="Gemini recommendations appear when a citizen SOS is received." />}</GlassCard>

    <GlassCard className="p-4">
      <PanelHeading title="Citizen Request Feed" subtitle="Live Vijayawada operations"><Activity className="h-5 w-5 text-primary" /></PanelHeading>
      <div className="mb-3 flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-text/50"><Search className="h-3.5 w-3.5 shrink-0" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request or emergency" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-text outline-none placeholder:text-text/35" /></label>
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-text/50"><Filter className="h-3.5 w-3.5" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="max-w-24 bg-transparent py-2 text-xs text-text outline-none"><option value="all" className="bg-secondary">All</option>{statuses.slice(1).map((item) => <option key={item} value={item} className="bg-secondary">{item.replace("_", " ")}</option>)}</select></label>
      </div>
      {loading ? <LoadingRows /> : filteredRequests.length === 0 ? <EmptyState message={error ? "Live request feed unavailable." : "No requests match this view."} tone={error ? "warning" : "default"} /> : <div className="max-h-80 space-y-3 overflow-y-auto pr-1">{filteredRequests.map((request) => <RequestCard key={request.id} request={request} />)}</div>}
    </GlassCard>

    <GlassCard className="p-4">
      <PanelHeading title="Rescue Operations" subtitle="Assignment and readiness stream"><Users className="h-5 w-5 text-accent" /></PanelHeading>
      {missions.length === 0 ? <EmptyState message="No rescue missions assigned yet." /> : <div className="space-y-2">{missions.map((mission) => <div key={mission.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><div className="min-w-0"><p className="text-sm font-medium text-text">{mission.request_id}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-text/45">{mission.readiness} / {relativeTime(mission.last_updated)}</p></div><StatusBadge tone={missionTone(mission.mission_status)}>{mission.mission_status.replace("_", " ")}</StatusBadge></div>)}</div>}
    </GlassCard>

    <GlassCard className="p-4"><PanelHeading title="System Status" subtitle="Subsystem readiness"><Sparkles className="h-5 w-5 text-accent" /></PanelHeading><div className="space-y-3"><StatusLine label="AI Detection Online" tone="success" /><StatusLine label="Citizen SOS Sync Online" tone="success" /><StatusLine label="Quantum Engine Standby" tone="accent" /></div></GlassCard>
  </div>;
}

function RequestCard({ request }: { request: RequestRow }) {
  return <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-primary/25 hover:bg-primary/[0.04]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-text">{request.request_id}</p><p className="mt-1 text-xs capitalize text-text/55">{request.emergency_type} / {request.people_count} people</p></div><StatusBadge tone={riskTone(request.risk_level)}>{request.risk_level}</StatusBadge></div><div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text/45"><span><b className="block text-[9px] font-normal text-text/35">Priority</b>{request.priority_score}</span><span><b className="block text-[9px] font-normal text-text/35">Confidence</b>{Math.round(request.ai_confidence)}%</span><span><b className="block text-[9px] font-normal text-text/35">Status</b>{request.status.replace("_", " ")}</span></div>{request.ai_recommendation && <p className="mt-2 text-[10px] text-primary/80">{request.ai_recommendation}</p>}</div>;
}

function PanelHeading({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <div className="mb-4 flex items-center justify-between"><div><p className="font-heading text-base font-semibold">{title}</p><p className="mt-1 text-xs text-text/50">{subtitle}</p></div>{children}</div>; }
function StatusLine({ label, tone }: { label: string; tone: "success" | "accent" | "warning" }) { const toneClass = tone === "success" ? "bg-success" : tone === "accent" ? "bg-accent" : "bg-warning"; return <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-text/75"><span>{label}</span><span className={`h-2 w-2 rounded-full ${toneClass} shadow-[0_0_13px_currentColor]`} /></div>; }
function LoadingRows() { return <div className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />)}</div>; }
function EmptyState({ message, tone = "default" }: { message: string; tone?: "default" | "warning" }) { return <div className={`rounded-xl border px-3 py-4 text-xs ${tone === "warning" ? "border-warning/20 text-warning/80" : "border-white/[0.08] text-text/45"}`}>{message}</div>; }
function riskDot(risk: string) { return riskTone(risk) === "danger" ? "bg-danger" : riskTone(risk) === "warning" ? "bg-warning" : "bg-success"; }
function riskTone(risk: string): "danger" | "warning" | "success" { return /critical|high|extreme/i.test(risk) ? "danger" : /moderate|medium/i.test(risk) ? "warning" : "success"; }
function missionTone(status: string): "danger" | "warning" | "success" | "neutral" { return /completed|returning/i.test(status) ? "success" : /assigned|en_route|on_scene/i.test(status) ? "warning" : "neutral"; }
function relativeTime(value: string) { const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000)); return minutes < 1 ? "just now" : `${minutes}m ago`; }
