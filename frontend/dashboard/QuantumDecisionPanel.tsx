"use client";

import { Atom, Bolt, CheckCircle2, Clock3, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { StatusBadge } from "@/components/StatusBadge";

export function QuantumDecisionPanel() {
  return <div className="relative rounded-2xl p-px quantum-border shadow-glow"><GlassCard className="relative overflow-hidden border-0 bg-card/95 p-5 md:p-6"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/10 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_24px_rgba(139,92,246,0.28)]"><Atom className="h-5 w-5" /></div><div><p className="font-heading text-xl font-semibold">Quantum Decision Engine</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-accent/75">Optimization layer / QAOA</p></div><StatusBadge tone="accent">Standby</StatusBadge></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><QuantumStat icon={CheckCircle2} label="Optimization Status" value="Ready" /><QuantumStat icon={Cpu} label="Resources Assigned" value="54 units" /><QuantumStat icon={Clock3} label="Last Optimization" value="--:-- UTC" /></div></div><div className="shrink-0 lg:min-w-[210px]"><motion.div animate={{ scale: [1, 1.015, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}><NeonButton size="lg" className="w-full text-background shadow-[0_0_32px_rgba(0,212,255,0.42)]"><Bolt className="h-5 w-5 fill-current" />Re-Optimize</NeonButton></motion.div><p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-text/40">QAOA simulator standby</p></div></div><div className="absolute left-0 top-0 h-8 w-8 border-l border-t border-primary/70" /><div className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-primary/70" /></GlassCard></div>;
}

function QuantumStat({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) { return <div className="flex items-center gap-3"><Icon className="h-4 w-4 shrink-0 text-primary" /><div><p className="text-[10px] uppercase tracking-[0.12em] text-text/45">{label}</p><p className="mt-1 font-mono text-sm text-text">{value}</p></div></div>; }
