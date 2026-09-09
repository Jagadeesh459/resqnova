"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Layers3, X } from "lucide-react";
import { useState } from "react";

export type MapLayerKey = "rescueTeams" | "ambulances" | "shelters" | "hospitals" | "citizenRequests" | "roads" | "villages" | "floodRisk" | "deploymentZones" | "floodZones" | "roadClosures" | "resourceClusters";
export type MapLayerState = Record<MapLayerKey, boolean>;
type LayerControlsProps = { layers: MapLayerState; onToggle: (key: MapLayerKey) => void; counts: Partial<Record<MapLayerKey, number>> };

const groups = [
  { title: "Resources", items: [["ambulances", "Ambulances", "bg-primary"], ["rescueTeams", "Rescue Teams", "bg-accent"], ["hospitals", "Hospitals", "bg-blue-400"], ["shelters", "Shelters", "bg-success"], ["citizenRequests", "Citizen SOS", "bg-danger"]] },
  { title: "Risk / Operations", items: [["roads", "Roads", "bg-warning"], ["roadClosures", "Road Closures", "bg-danger"], ["floodRisk", "High Risk Zones", "bg-danger"], ["floodZones", "Flood Zones", "bg-warning"], ["deploymentZones", "Deployment Zones", "bg-blue-400"], ["resourceClusters", "Resource Clusters", "bg-primary"], ["villages", "Villages", "bg-orange-300"]] },
] as const;

export function LayerControls({ layers, onToggle, counts }: LayerControlsProps) {
  const [open, setOpen] = useState(false);
  return <div className="pointer-events-auto relative"><button type="button" aria-label="Open map layers" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="grid h-11 w-11 place-items-center rounded-full border border-primary/35 bg-background/85 text-primary shadow-neon backdrop-blur-xl transition hover:scale-105 hover:border-primary hover:bg-primary/15 hover:shadow-glow">{open ? <X className="h-5 w-5" /> : <Layers3 className="h-5 w-5" />}</button><AnimatePresence>{open && <><button type="button" aria-label="Close map layers" onClick={() => setOpen(false)} className="fixed inset-0 z-[499] cursor-default bg-background/10" /><motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.2 }} className="absolute right-0 top-14 z-[500] w-64 rounded-2xl border border-primary/20 bg-background/95 p-3 shadow-glass backdrop-blur-xl"><div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2"><Layers3 className="h-4 w-4 text-primary" /><p className="font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-text">Tactical layers</p></div>{groups.map((group) => <div key={group.title} className="mb-3 last:mb-0"><p className="mb-1 px-2 text-[9px] uppercase tracking-[0.2em] text-primary/70">{group.title}</p><div className="space-y-1">{group.items.map(([key, label, color]) => <button key={key} type="button" onClick={() => onToggle(key)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] text-text/70 transition hover:bg-white/5 hover:text-text"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${color}`} />{label} ({counts[key] ?? 0})</span><span className={`relative h-4 w-7 rounded-full transition ${layers[key] ? "bg-primary/70" : "bg-white/15"}`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${layers[key] ? "left-3.5" : "left-0.5"}`} /></span></button>)}</div></div>)}</motion.aside></>}</AnimatePresence></div>;
}
