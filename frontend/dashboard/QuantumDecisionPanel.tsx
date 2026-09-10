"use client";

import { useState } from "react";
import { Atom, Bolt, CheckCircle2, Clock3, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { StatusBadge } from "@/components/StatusBadge";

type QuantumResult = { status?: string; runtime_ms?: number; qubo_cost?: number; input_summary?: { ambulances?: number; rescue_teams?: number; shelters?: number }; error?: string };

export function QuantumDecisionPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QuantumResult | null>(null);

  const optimize = async () => {
    setRunning(true);
    try {
      const response = await fetch("/api/quantum/optimize", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      setResult(await response.json() as QuantumResult);
    } catch (error) {
      setResult({ status: "failed", error: error instanceof Error ? error.message : "Quantum engine unavailable." });
    } finally {
      setRunning(false);
    }
  };

  const status = running ? "Running" : result?.status === "completed" ? "Complete" : result?.status === "failed" ? "Failed" : result?.status === "unavailable" ? "Unavailable" : "Standby";
  const assigned = result?.input_summary ? `${(result.input_summary.ambulances ?? 0) + (result.input_summary.rescue_teams ?? 0)} units` : "Live Supabase";
  return <div className="relative rounded-2xl p-px quantum-border shadow-glow"><GlassCard className="relative overflow-hidden border-0 bg-card/95 p-5 md:p-6"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/10 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_24px_rgba(139,92,246,0.28)]"><Atom className="h-5 w-5" /></div><div><p className="font-heading text-xl font-semibold">Quantum Decision Engine</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-accent/75">Live Supabase / QAOA</p></div><StatusBadge tone={status === "Failed" ? "danger" : status === "Complete" ? "success" : "accent"}>{status}</StatusBadge></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><QuantumStat icon={CheckCircle2} label="Optimization Status" value={status} /><QuantumStat icon={Cpu} label="Live Resources" value={assigned} /><QuantumStat icon={Clock3} label="Last Runtime" value={result?.runtime_ms != null ? `${result.runtime_ms} ms` : "--"} /></div>{result?.error && <p className="mt-4 max-w-xl rounded-xl border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">{result.error}</p>}{result?.qubo_cost != null && <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-primary/70">Best QUBO energy: {result.qubo_cost.toFixed(2)}</p>}</div><div className="shrink-0 lg:min-w-[210px]"><motion.div animate={{ scale: running ? [1, 1.015, 1] : 1 }} transition={{ duration: 1.2, repeat: running ? Infinity : 0, ease: "easeInOut" }}><NeonButton size="lg" onClick={() => void optimize()} disabled={running} className="w-full text-background shadow-[0_0_32px_rgba(0,212,255,0.42)]"><Bolt className="h-5 w-5 fill-current" />{running ? "Optimizing..." : "Re-Optimize"}</NeonButton></motion.div><p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-text/40">QAOA statevector / COBYLA</p></div></div><div className="absolute left-0 top-0 h-8 w-8 border-l border-t border-primary/70" /><div className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-primary/70" /></GlassCard></div>;
}

function QuantumStat({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) { return <div className="flex items-center gap-3"><Icon className="h-4 w-4 shrink-0 text-primary" /><div><p className="text-[10px] uppercase tracking-[0.12em] text-text/45">{label}</p><p className="mt-1 font-mono text-sm text-text">{value}</p></div></div>; }
