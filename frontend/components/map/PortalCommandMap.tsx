"use client";

import dynamic from "next/dynamic";

const APMap = dynamic(() => import("@/components/map/APMap").then((module) => module.APMap), { ssr: false });

export function PortalCommandMap({ className = "h-[420px]" }: { className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border border-[#00D4FF]/25 bg-[#07111F] shadow-[0_12px_40px_rgba(0,0,0,0.32)] ${className}`}>
      <div className="absolute left-4 top-4 z-[500] rounded-lg border border-[#00D4FF]/25 bg-[#07111F]/90 px-3 py-2 backdrop-blur-xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00D4FF]">Vijayawada operational map</p>
        <p className="mt-1 text-xs text-white/60">Live Supabase resources</p>
      </div>
      <APMap fullscreen={false} onFullscreenToggle={() => undefined} />
    </section>
  );
}
