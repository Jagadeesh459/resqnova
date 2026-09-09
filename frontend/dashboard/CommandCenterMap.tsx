"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Radio } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const APMap = dynamic(() => import("@/components/map/APMap").then((module) => module.APMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-[#081827] font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Initializing GIS boundary layer...</div>,
});

type CommandCenterMapProps = {
  fullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
};

export function CommandCenterMap({ fullscreen, onFullscreenChange }: CommandCenterMapProps) {
  const [utc, setUtc] = useState("--:--:--");

  useEffect(() => {
    const updateClock = () => setUtc(new Date().toISOString().slice(11, 19));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFullscreenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen, onFullscreenChange]);

  return <GlassCard className={`relative overflow-hidden border-primary/20 bg-secondary/60 p-0 shadow-glow ${fullscreen ? "fixed inset-2 z-[80] h-[calc(100vh-1rem)] min-h-0" : "min-h-[520px] lg:min-h-[640px]"}`}>
    <div className={`relative z-0 ${fullscreen ? "h-full" : "h-[520px] lg:h-[640px]"}`}><APMap fullscreen={fullscreen} onFullscreenToggle={() => onFullscreenChange(!fullscreen)} /></div>
    <div className="absolute left-5 top-5 z-30 flex items-center gap-3">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-neon"><Crosshair className="h-5 w-5" /></motion.div>
      <div><p className="font-heading text-sm font-semibold tracking-wide text-text">Vijayawada Command Map</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-primary/75">Vijayawada Digital Twin</p></div>
    </div>
    <div className="absolute right-5 top-5 z-30 flex items-center gap-2 rounded-full border border-success/25 bg-background/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text/70 shadow-glass backdrop-blur-xl"><span className="h-2 w-2 rounded-full bg-success shadow-[0_0_14px_rgba(34,197,94,0.85)]" />UTC {utc}<span className="text-text/30">/</span><span className="text-success">Network nominal</span></div>
    <div className="absolute left-3 top-3 z-30 h-10 w-10 border-l border-t border-primary/70" /><div className="absolute right-3 top-3 z-30 h-10 w-10 border-r border-t border-primary/70" /><div className="absolute bottom-3 left-3 z-30 h-10 w-10 border-b border-l border-primary/70" /><div className="absolute bottom-3 right-3 z-30 h-10 w-10 border-b border-r border-primary/70" />
    <div className="absolute inset-x-5 bottom-5 z-30 flex flex-wrap items-end justify-between gap-4"><div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text/45"><p>16.5062 N / 80.6480 E</p><p className="mt-1">UTC {utc} / AP GIS GRID</p></div><div className="flex items-center gap-2 rounded-full border border-white/10 bg-background/70 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-text/60 backdrop-blur-md"><Radio className="h-3.5 w-3.5 text-primary" />Live network</div></div>
  </GlassCard>;
}
