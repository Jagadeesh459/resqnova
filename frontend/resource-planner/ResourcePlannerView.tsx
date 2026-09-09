"use client";

import { Boxes, Hospital, Route, ShieldCheck, Siren } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { StatusBadge } from "@/components/StatusBadge";

const modules = [
  ["Rescue Teams", "Stage teams by flood-risk zone before activation.", ShieldCheck],
  ["Ambulances", "Review ready vehicles and deployment coverage.", Siren],
  ["Shelter Readiness", "Check capacity, food, and medical stock.", Boxes],
  ["Hospital Readiness", "Monitor beds and emergency intake capacity.", Hospital],
] as const;

export function ResourcePlannerView() {
  return <AppShell title="Resource Planner" description="Pre-position Vijayawada response assets before risk escalates" activePath="/resource-planner"><div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.25em] text-primary">UC-077 / Authority Module</p><p className="mt-2 text-sm text-text/60">Vijayawada operational area</p></div><StatusBadge tone="accent">Planning mode</StatusBadge></div><div className="grid gap-4 md:grid-cols-2">{modules.map(([title, description, Icon]) => <GlassCard key={title} className="min-h-40"><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-text">{title}</p><p className="mt-2 max-w-sm text-sm leading-6 text-text/60">{description}</p></div><div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary shadow-neon"><Icon className="h-5 w-5" /></div></div><div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text/45"><span className="h-2 w-2 rounded-full bg-success" /> Data foundation ready</div></GlassCard>)}</div><GlassCard className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-semibold text-text">Deployment Optimization</p><p className="mt-1 text-sm text-text/60">Quantum-assisted allocation will be enabled in a future batch.</p></div><NeonButton disabled><Route className="h-4 w-4" />Optimize Deployment</NeonButton></GlassCard></div></AppShell>;
}
