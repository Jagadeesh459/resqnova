"use client";

import { CircleAlert, House, Route, Waves } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { StatusBadge } from "@/components/StatusBadge";

const modules = [
  ["High-Risk Villages", "Prepare village-level risk and population inputs.", CircleAlert],
  ["Available Shelters", "Review safe capacity across NTR staging areas.", House],
  ["Safe Routes", "Keep route graph inputs ready for evacuation planning.", Route],
  ["Evacuation Summary", "Consolidate readiness before a flood event.", Waves],
] as const;

export function EvacuationPlannerView() {
  return <AppShell title="Evacuation Planner" description="Prepare Vijayawada movement corridors before flooding" activePath="/evacuation-planner"><div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.25em] text-primary">UC-077 / Authority Module</p><p className="mt-2 text-sm text-text/60">Vijayawada operational area</p></div><StatusBadge tone="accent">Planning mode</StatusBadge></div><div className="grid gap-4 md:grid-cols-2">{modules.map(([title, description, Icon]) => <GlassCard key={title} className="min-h-40"><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-text">{title}</p><p className="mt-2 max-w-sm text-sm leading-6 text-text/60">{description}</p></div><div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary shadow-neon"><Icon className="h-5 w-5" /></div></div><div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text/45"><span className="h-2 w-2 rounded-full bg-success" /> Data foundation ready</div></GlassCard>)}</div><GlassCard className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-semibold text-text">Evacuation Optimization</p><p className="mt-1 text-sm text-text/60">Route and shelter allocation will be enabled in a future batch.</p></div><NeonButton disabled><Route className="h-4 w-4" />Optimize Evacuation</NeonButton></GlassCard></div></AppShell>;
}
