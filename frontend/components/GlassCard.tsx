import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <section
      className={cn(
        "glass-surface rounded-2xl p-5 shadow-glass transition-all duration-300 hover:border-primary/30 hover:shadow-glow",
        className,
      )}
    >
      {children}
    </section>
  );
}
