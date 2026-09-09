"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, History } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { createClient } from "@/lib/supabase/client";

type ResolvedRow = { id: string; last_updated: string; citizen_requests?: { request_id: string; emergency_type: string; people_count: number; priority_score: number; total_duration_minutes: number | null } | null; rescue_teams?: { team_name: string } | null; ambulances?: { vehicle_code: string } | null };

export function ResolvedOperations() {
  const [rows, setRows] = useState<ResolvedRow[]>([]);
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase.from("rescue_missions").select("id,last_updated,citizen_requests:request_id(request_id,emergency_type,people_count,priority_score,total_duration_minutes),rescue_teams:rescue_team_id(team_name),ambulances:ambulance_id(vehicle_code)").eq("mission_status", "completed").order("last_updated", { ascending: false }).limit(50);
      if (active) setRows((data ?? []) as unknown as ResolvedRow[]);
    };
    void load();
    const channel = supabase.channel(`resolved-operations-${Date.now()}`).on("postgres_changes", { event: "*", schema: "public", table: "rescue_missions" }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  return <AppShell title="Resolved Operations" description="Historical Vijayawada response outcomes" activePath="/resolved-operations"><GlassCard className="overflow-hidden p-0"><div className="flex items-center gap-3 border-b border-white/10 p-5"><History className="text-primary" /><div><p className="font-heading font-semibold">Mission history</p><p className="text-xs text-text/50">Completed missions remain available for accountability and response analysis.</p></div></div>{rows.length === 0 ? <p className="p-5 text-sm text-text/50">No completed missions yet.</p> : <div className="divide-y divide-white/10">{rows.map((row) => <div key={row.id} className="grid gap-3 p-5 text-sm md:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr]"><div><p className="font-mono text-primary">{row.citizen_requests?.request_id ?? "--"}</p><p className="mt-1 text-text/60">{row.citizen_requests?.emergency_type ?? "Emergency"} / {row.citizen_requests?.people_count ?? 0} people</p></div><p className="text-text/70">Priority <strong className="block text-text">{row.citizen_requests?.priority_score ?? 0}</strong></p><p className="text-text/70">Rescue <strong className="block text-text">{row.rescue_teams?.team_name ?? "--"}</strong></p><p className="text-text/70">Ambulance <strong className="block text-text">{row.ambulances?.vehicle_code ?? "--"}</strong></p><p className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" />{row.citizen_requests?.total_duration_minutes ? `${Math.round(row.citizen_requests.total_duration_minutes)} min` : new Date(row.last_updated).toLocaleDateString()}<Clock3 className="ml-1 h-3.5 w-3.5" /></p></div>)}</div>}</GlassCard></AppShell>;
}
