import Link from "next/link";
import { ArrowRight, Database, Radar, ShieldAlert, Waves } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { MetricCard } from "@/components/MetricCard";
import { NeonButton } from "@/components/NeonButton";
import { StatusBadge } from "@/components/StatusBadge";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0 grid-shell opacity-25" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-heading text-3xl font-semibold tracking-wide text-text md:text-4xl">
              ResQNova
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.3em] text-text/55">
              Futuristic Emergency Command Center
            </p>
          </div>
          <StatusBadge tone="accent">Design System Preview</StatusBadge>
        </div>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <GlassCard className="relative overflow-hidden p-8 md:p-10">
              <div className="absolute inset-0 bg-radial-grid opacity-40" />
              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.26em] text-primary">
                  <Radar className="h-4 w-4" />
                  Command Interface Ready
                </div>
                <div className="max-w-3xl space-y-4">
                  <h1 className="font-heading text-4xl font-semibold leading-tight md:text-6xl">
                    Intelligent Disaster Response. Reimagined.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-text/72 md:text-lg">
                    A clean foundation for the next generation of emergency
                    response operations, built for speed, clarity, and future
                    integrations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <NeonButton size="lg">Launch Command View</NeonButton>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-text/80 transition hover:border-primary/25 hover:bg-primary/10 hover:text-primary"
                  >
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </GlassCard>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Command Uptime"
                value="24/7"
                helper="Always-on shell established"
                icon={ShieldAlert}
              />
              <MetricCard
                label="Modules Ready"
                value="05"
                helper="Dashboard plus core routes"
                icon={Database}
              />
              <MetricCard
                label="Visual Signal"
                value="NOVA"
                helper="Glassmorphism theme active"
                icon={Waves}
              />
              <MetricCard
                label="Latency"
                value="< 1s"
                helper="Future data contracts ready"
                icon={Radar}
              />
            </div>
          </div>

          <div className="space-y-6">
            <GlassCard className="space-y-4 p-6">
              <p className="font-heading text-xl font-semibold">
                Design System
              </p>
              <p className="text-sm leading-6 text-text/70">
                Glass cards, neon accents, and calm contrast tuned for a
                command-center feel without introducing business logic.
              </p>
            </GlassCard>

            <GlassCard className="space-y-4 p-6">
              <p className="font-heading text-xl font-semibold">
                Future Ready
              </p>
              <p className="text-sm leading-6 text-text/70">
                Structured for upcoming Supabase, Leaflet, FastAPI, and Qiskit
                layers while keeping this batch strictly foundational.
              </p>
            </GlassCard>
          </div>
        </section>
      </div>
    </main>
  );
}
