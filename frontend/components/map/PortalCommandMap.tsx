"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const APMap = dynamic(() => import("@/components/map/APMap").then((module) => module.APMap), { ssr: false });

export function PortalCommandMap({ className = "h-[420px]" }: { className?: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [fullscreen]);
  return (
    <section className={`${fullscreen ? "fixed inset-3 z-[1000] h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] rounded-2xl" : `relative ${className}`} isolate overflow-hidden border border-[#00D4FF]/25 bg-[#07111F] shadow-[0_12px_40px_rgba(0,0,0,0.32)]`}>
      <div className="absolute left-4 top-4 z-[500] rounded-lg border border-[#00D4FF]/25 bg-[#07111F]/90 px-3 py-2 backdrop-blur-xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00D4FF]">Vijayawada operational map</p>
        <p className="mt-1 text-xs text-white/60">Live Supabase resources</p>
      </div>
      <APMap fullscreen={fullscreen} onFullscreenToggle={() => setFullscreen((current) => !current)} />
    </section>
  );
}
