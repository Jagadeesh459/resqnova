"use client";

import { Activity, Ambulance, Clock3, MapPin, Radio, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { PortalCommandMap } from "@/components/map/PortalCommandMap";
import { createClient } from "@/lib/supabase/client";

type Vehicle = { id: string; vehicle_code: string; status: string; latitude: number; longitude: number; deployment_zone: string | null; crew_size: number | null; fuel: number | null; assigned_request_id: string | null; updated_at: string | null; citizen_requests?: { request_id: string; emergency_type: string; people_count: number; risk_level: string; ai_confidence: number; priority_score: number; eta: string | null; latitude: number; longitude: number } | null };

export function LiveAmbulanceOverview() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data } = await supabase.from("ambulances").select("id,vehicle_code,status,latitude,longitude,deployment_zone,crew_size,fuel,assigned_request_id,updated_at,citizen_requests:assigned_request_id(request_id,emergency_type,people_count,risk_level,ai_confidence,priority_score,eta,latitude,longitude)").or(`manager_auth_id.eq.${authData.user.id},manager_auth_id.is.null`).order("assigned_request_id", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (active) setVehicle(data as unknown as Vehicle | null);
    };
    void load();
    const channel = supabase.channel(`ambulance-live-overview-${Date.now()}`).on("postgres_changes", { event: "*", schema: "public", table: "ambulances" }, () => { void load(); }).on("postgres_changes", { event: "*", schema: "public", table: "citizen_requests" }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  const request = vehicle?.citizen_requests;
  return <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5 p-4 pb-28 sm:p-6"><PortalCommandMap className="h-[420px]" /><div className="flex items-center gap-3 rounded-2xl border border-[#00D4FF]/25 bg-[#0a1b2d]/90 p-4"><Radio className="text-[#00D4FF]" /><div><p className="text-sm font-bold text-white">Live Ambulance Operations</p><p className="text-xs text-[#8AA3BC]">Vehicle state and dispatch assignments are synchronized with Supabase.</p></div></div>{!vehicle ? <div className="rounded-2xl border border-white/10 bg-[#0a1c30]/80 p-6 text-sm text-[#8AA3BC]">No ambulance record is assigned to this account yet.</div> : <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-[#00D4FF]/25 bg-[#0a1c30]/95 p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><Ambulance className="text-[#00D4FF]" /><div><h1 className="text-xl font-bold text-white">{vehicle.vehicle_code}</h1><p className="text-xs uppercase tracking-[0.16em] text-[#8AA3BC]">{vehicle.deployment_zone ?? "Vijayawada operations"}</p></div></div><span className="rounded-full border border-[#00D4FF]/30 px-3 py-1 text-xs uppercase text-[#7ce2fe]">{vehicle.status}</span></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p className="rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]">Crew<strong className="mt-1 block text-white">{vehicle.crew_size ?? 0}</strong></p><p className="rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]">Fuel<strong className="mt-1 block text-white">{vehicle.fuel ?? 0}%</strong></p><p className="rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]">GPS<strong className="mt-1 block font-mono text-white">{vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}</strong></p><p className="rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]">Updated<strong className="mt-1 block text-white">{vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleTimeString() : "--"}</strong></p></div></section><section className="rounded-2xl border border-[#EF4444]/25 bg-[#0a1c30]/95 p-5">{request ? <><div className="flex items-center gap-2 text-[#ff8a8a]"><ShieldAlert className="h-5 w-5" /><p className="font-bold">Active AI Dispatch</p></div><h2 className="mt-4 text-xl font-bold text-white">{request.request_id}</h2><p className="mt-1 text-sm capitalize text-[#a4bed8]">{request.emergency_type} / {request.people_count} people</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p className="rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]">Risk<strong className="mt-1 block uppercase text-[#ff8a8a]">{request.risk_level} ({request.priority_score})</strong></p><p className="rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]">Confidence<strong className="mt-1 block text-white">{request.ai_confidence}%</strong></p><p className="col-span-2 flex items-center gap-2 rounded-xl bg-[#06111f] p-3 text-[#8AA3BC]"><MapPin className="h-4 w-4 text-[#00D4FF]" />{request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}<Clock3 className="ml-auto h-4 w-4 text-[#00D4FF]" />{request.eta ? new Date(request.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "ETA pending"}</p></div></> : <div className="text-sm text-[#8AA3BC]">No active AI assignment for this ambulance.</div>}</section></div>}</div>;
}
