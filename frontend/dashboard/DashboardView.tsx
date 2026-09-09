"use client";

import { Ambulance, Building2, Clock3, Radio, ShieldAlert, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import { GlassCard } from "@/components/GlassCard";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { CommandCenterMap } from "@/dashboard/CommandCenterMap";
import { IntelligencePanel } from "@/dashboard/IntelligencePanel";
import { QuantumDecisionPanel } from "@/dashboard/QuantumDecisionPanel";
import { fetchDashboardMetrics, subscribeToDashboardMetrics, type DashboardMetrics } from "@/lib/dashboard/metrics";

const metricDefinitions = [
  { key: "high_risk_zones", label: "High-Risk Zones", helper: "Forecast zones requiring planning", icon: ShieldAlert, accentClassName: "text-danger shadow-[0_0_22px_rgba(239,68,68,0.24)]" },
  { key: "ready_ambulances", label: "Ready Ambulances", helper: "Vijayawada units staged for dispatch", icon: Ambulance },
  { key: "ready_rescue_teams", label: "Ready Rescue Teams", helper: "Vijayawada teams ready to mobilize", icon: Users, accentClassName: "text-accent shadow-[0_0_22px_rgba(139,92,246,0.24)]" },
  { key: "available_shelter_capacity", label: "Available Shelter Capacity", helper: "People that can be accommodated", icon: Building2, accentClassName: "text-success shadow-[0_0_22px_rgba(34,197,94,0.24)]" },
] as const;

type DashboardMetric = (typeof metricDefinitions)[number] & { value: string };
type MetricsStatus = "loading" | "ready" | "empty" | "error";

const initialMetrics: DashboardMetric[] = metricDefinitions.map((metric) => ({
  ...metric,
  value: "--",
}));

function formatMetrics(data: DashboardMetrics): DashboardMetric[] {
  return metricDefinitions.map((metric) => ({
    ...metric,
    value: String(data[metric.key] ?? 0),
  }));
}

function hasRecords(metrics: DashboardMetric[]) {
  return metrics.some((metric) => Number(metric.value) > 0);
}

function MetricCardSkeleton({ metric }: { metric: { label: string; helper: string; icon: LucideIcon; accentClassName?: string } }) {
  const Icon = metric.icon;

  return <GlassCard className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.28em] text-text/60">{metric.label}</p><div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-white/10" /><div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/5" /></div><div className={`rounded-2xl border border-white/10 bg-white/5 p-3 text-primary shadow-neon ${metric.accentClassName ?? ""}`}><Icon className="h-5 w-5 opacity-60" /></div></div></GlassCard>;
}

export function DashboardView() {
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState(initialMetrics);
  const [preparedness, setPreparedness] = useState({ forecast: "--", resources: "--", evacuation: "--" });
  const [metricsStatus, setMetricsStatus] = useState<MetricsStatus>("loading");

  useEffect(() => {
    let active = true;

    const loadMetrics = () => fetchDashboardMetrics()
      .then((data) => {
        if (!active) return;
        const nextMetrics = formatMetrics(data);
        setLiveMetrics(nextMetrics);
        setPreparedness({ forecast: data.forecast_status, resources: data.resource_readiness, evacuation: data.evacuation_readiness });
        setMetricsStatus(hasRecords(nextMetrics) ? "ready" : "empty");
      })
      .catch(() => {
        if (active) setMetricsStatus("error");
      });

    loadMetrics();
    const unsubscribe = subscribeToDashboardMetrics(() => { void loadMetrics(); });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AppShell title="Vijayawada Command Center" description="Vijayawada resource readiness and flood-risk monitoring" activePath="/dashboard">
      <div className="relative space-y-5 pb-6"><div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-text/50"><span className="h-2 w-2 animate-pulse rounded-full bg-danger shadow-[0_0_14px_rgba(239,68,68,0.8)]" />UC-077 / Vijayawada Digital Twin</div><div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-text/45"><span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-primary" />UTC 02:17:42</span><span className="hidden items-center gap-2 sm:flex"><Radio className="h-3.5 w-3.5 text-success" />Network nominal</span></div></div>
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metricsStatus === "loading" ? metricDefinitions.map((metric) => <motion.div key={metric.label} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.45 }}><MetricCardSkeleton metric={metric} /></motion.div>) : liveMetrics.map(({ key, ...metric }) => <motion.div key={key} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.45 }}><MetricCard {...metric} /></motion.div>)}</motion.div>
        {metricsStatus === "error" && <AlertBanner title="Live metrics unavailable" message="The command center could not reach Supabase. Apply the foundation migration and verify frontend/.env.local before continuing." tone="warning" />}
        {metricsStatus === "empty" && <AlertBanner title="No operational records yet" message="Supabase is connected, but the operational tables do not contain records yet." tone="info" />}
        {metricsStatus === "ready" && <GlassCard className="p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-primary">Preparedness Overview</p><p className="mt-1 text-sm text-text/60">Vijayawada operational posture</p></div><div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">{[{ label: "Forecast Status", value: preparedness.forecast }, { label: "Resource Readiness", value: preparedness.resources }, { label: "Evacuation Readiness", value: preparedness.evacuation }].map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[10px] uppercase tracking-[0.18em] text-text/45">{item.label}</p><p className="mt-1 font-mono text-sm text-success">{item.value}</p></div>)}</div></div></GlassCard>}
        <div className={`grid items-start gap-4 ${mapFullscreen ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1.7fr)_minmax(17rem,0.55fr)]"}`}><CommandCenterMap fullscreen={mapFullscreen} onFullscreenChange={setMapFullscreen} />{!mapFullscreen && <IntelligencePanel />}</div>
        <QuantumDecisionPanel />
      </div>
    </AppShell>
  );
}
