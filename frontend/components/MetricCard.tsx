import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  accentClassName?: string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accentClassName,
  className,
}: MetricCardProps) {
  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-text/60">
            {label}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-text md:text-3xl">
            {value}
          </p>
          {helper ? (
            <p className="mt-2 text-sm leading-6 text-text/70">{helper}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "rounded-2xl border border-white/10 bg-white/5 p-3 text-primary shadow-neon",
              accentClassName,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
