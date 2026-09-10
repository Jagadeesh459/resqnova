"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, Radio } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { createClient } from "@/lib/supabase/client";

type RequestRow = { id: string; request_id: string; emergency_type: string; status: string; ai_stage: string; priority_score: number; ai_confidence: number; created_at: string };
type LogRow = { id: string; request_id: string; step: string; status: string; details: Record<string, unknown>; created_at: string };
const steps = ["sos_received", "ai_triggered", "risk_calculated", "rescue_assigned", "ambulance_assigned", "shelter_assigned", "notifications_sent"];

function label(value: string) { return value.replaceAll("_", " "); }

export default function Page() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const [{ data: requestData, error: requestError }, { data: logData, error: logError }] = await Promise.all([
        supabase.from("citizen_requests").select("id,request_id,emergency_type,status,ai_stage,priority_score,ai_confidence,created_at").order("created_at", { ascending: false }).limit(12),
        supabase.from("ai_execution_logs").select("id,request_id,step,status,details,created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      if (!active) return;
      if (requestError || logError) setError(requestError?.message || logError?.message || "Diagnostics data unavailable.");
      setRequests((requestData ?? []) as RequestRow[]);
      setLogs((logData ?? []) as LogRow[]);
    };
    void load();
    const channel = supabase.channel(`ai-diagnostics-${Date.now()}`).on("postgres_changes", { event: "*", schema: "public", table: "citizen_requests" }, () => { void load(); }).on("postgres_changes", { event: "*", schema: "public", table: "ai_execution_logs" }, () => { void load(); }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  return <AppShell title="AI Diagnostics" description="Auditable SOS triage and dispatch pipeline" activePath="/admin/ai-diagnostics"><div className="space-y-4"><GlassCard className="p-4"><div className="flex items-center gap-3"><Radio className="h-5 w-5 text-primary" /><div><p className="text-xs uppercase tracking-[0.24em] text-primary">AI execution monitor</p><p className="mt-1 text-sm text-text/55">Every status is read from Supabase in realtime.</p></div></div>{error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}</GlassCard>{requests.map((request) => { const requestLogs = logs.filter((log) => log.request_id === request.id); return <GlassCard key={request.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs text-primary">{request.request_id}</p><p className="mt-1 text-sm font-semibold capitalize text-text">{label(request.emergency_type)} <span className="font-normal text-text/50">/ {label(request.status)}</span></p></div><div className="flex gap-2 font-mono text-[10px] uppercase text-text/55"><span>Risk {Math.round(request.priority_score)}</span><span>AI {Math.round(request.ai_confidence)}%</span><span>{label(request.ai_stage)}</span></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step) => { const entry = requestLogs.find((log) => log.step === step); const success = entry?.status === "success"; const failed = entry?.status === "failed"; return <div key={step} className={`rounded-xl border px-3 py-2 ${success ? "border-success/30 bg-success/10" : failed ? "border-danger/30 bg-danger/10" : "border-white/10 bg-white/[0.03]"}`}><div className="flex items-center gap-2">{success ? <CheckCircle2 className="h-4 w-4 text-success" /> : failed ? <CircleAlert className="h-4 w-4 text-danger" /> : entry ? <LoaderCircle className="h-4 w-4 animate-spin text-warning" /> : <span className="h-4 w-4 rounded-full border border-white/20" />}<span className="text-xs capitalize text-text/75">{label(step)}</span></div><p className="mt-1 pl-6 text-[10px] uppercase tracking-[0.16em] text-text/40">{success ? "Success" : failed ? "Failed" : "Pending"}</p></div>; })}</div></GlassCard>})}{requests.length === 0 && <GlassCard className="p-6 text-sm text-text/55">No SOS executions recorded yet.</GlassCard>}</div></AppShell>;
}
