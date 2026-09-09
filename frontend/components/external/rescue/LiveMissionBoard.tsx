"use client";

import { CheckCircle2, MapPin, Radio, Siren, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PortalCommandMap } from "@/components/map/PortalCommandMap";

type Mission = {
  id: string;
  request_id: string;
  mission_status: string;
  latitude: number;
  longitude: number;
  citizen_requests?: { request_id: string; people_count: number; emergency_type: string; risk_level: string; eta: string | null } | null;
};

export function LiveMissionBoard({ onOpenMission }: { onOpenMission: (id: string) => void }) {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("rescue_missions").select("id,request_id,mission_status,latitude,longitude,citizen_requests:request_id(request_id,people_count,emergency_type,risk_level,eta)").neq("mission_status", "completed").order("last_updated", { ascending: false });
      if (active) setMissions((data ?? []) as unknown as Mission[]);
    };
    void load();
    const channel = supabase.channel(`rescue-live-${Date.now()}`).on("postgres_changes", { event: "*", schema: "public", table: "rescue_missions" }, () => { void load(); }).on("postgres_changes", { event: "*", schema: "public", table: "citizen_requests" }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  const updateMission = async (mission: Mission, status: "en_route" | "on_scene" | "completed") => {
    const supabase = createClient();
    await supabase.from("rescue_missions").update({ mission_status: status, last_updated: new Date().toISOString() }).eq("id", mission.id);
    await supabase.from("citizen_requests").update({ status: status === "en_route" ? "en_route" : status === "on_scene" ? "on_scene" : "resolved" }).eq("id", mission.request_id);
  };

  return <div className="w-full flex flex-col gap-5 py-4 px-4 sm:px-6 max-w-[1720px] mx-auto pb-28"><PortalCommandMap className="h-[420px]" /><div className="flex items-center justify-between rounded-2xl border border-[#00D4FF]/25 bg-[#0a1b2d]/90 p-4"><div className="flex items-center gap-3"><Radio className="text-[#00D4FF]" /><div><p className="text-sm font-bold text-white">Live Rescue Missions</p><p className="text-xs text-[#8AA3BC]">Assignments and status from Supabase</p></div></div><span className="rounded-full bg-[#00D4FF]/15 px-3 py-1 text-xs font-mono text-[#7ce2fe]">{missions.length} ACTIVE</span></div>{missions.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#0a1c30]/80 p-6 text-sm text-[#8AA3BC]">No active rescue assignments. New citizen SOS requests will appear here automatically.</div>}{missions.map((mission) => { const request = mission.citizen_requests; return <article key={mission.id} className="rounded-2xl border border-[#00D4FF]/25 bg-[#0a1c30]/95 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-mono text-[#00D4FF]"><Siren className="h-4 w-4" />{request?.request_id ?? mission.request_id}</div><h2 className="mt-2 text-2xl font-bold text-white">{request?.emergency_type ?? "Emergency response"}</h2><p className="mt-1 text-sm text-[#a4bed8]">{request?.people_count ?? 0} people / {request?.risk_level ?? "pending"} risk</p></div><span className="rounded-full border border-[#FFD43B]/40 bg-[#FFD43B]/10 px-3 py-1 text-xs font-mono uppercase text-[#FFD43B]">{mission.mission_status.replace("_", " ")}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#06111f]/90 p-3"><MapPin className="h-4 w-4 text-[#00D4FF]" /><p className="mt-2 text-xs text-[#8AA3BC]">Coordinates</p><p className="font-mono text-sm text-white">{mission.latitude.toFixed(4)}, {mission.longitude.toFixed(4)}</p></div><div className="rounded-xl bg-[#06111f]/90 p-3"><Truck className="h-4 w-4 text-[#00D4FF]" /><p className="mt-2 text-xs text-[#8AA3BC]">ETA</p><p className="font-mono text-sm text-white">{request?.eta ? new Date(request.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Pending"}</p></div><div className="rounded-xl bg-[#06111f]/90 p-3"><CheckCircle2 className="h-4 w-4 text-[#4ae183]" /><p className="mt-2 text-xs text-[#8AA3BC]">Dispatch</p><p className="font-mono text-sm text-white">AI coordinated</p></div></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => onOpenMission(mission.id)} className="rounded-lg border border-[#00D4FF]/40 px-4 py-2 text-xs font-bold text-[#00D4FF]">View on map</button><button onClick={() => void updateMission(mission, "en_route")} className="rounded-lg bg-[#00D4FF] px-4 py-2 text-xs font-bold text-[#081321]">En route</button><button onClick={() => void updateMission(mission, "on_scene")} className="rounded-lg border border-[#FFD43B]/40 px-4 py-2 text-xs font-bold text-[#FFD43B]">On scene</button><button onClick={() => void updateMission(mission, "completed")} className="rounded-lg border border-[#4ae183]/40 px-4 py-2 text-xs font-bold text-[#4ae183]">Completed</button></div></article>; })}</div>;
}
