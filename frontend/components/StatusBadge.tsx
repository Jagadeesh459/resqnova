import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  className?: string;
};

const toneClasses = {
  neutral: "border-white/10 bg-white/5 text-text/80",
  success: "border-success/25 bg-success/15 text-success",
  warning: "border-warning/25 bg-warning/15 text-warning",
  danger: "border-danger/25 bg-danger/15 text-danger",
  accent: "border-primary/25 bg-primary/15 text-primary",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
