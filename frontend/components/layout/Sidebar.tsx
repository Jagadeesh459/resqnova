"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNavItems } from "@/lib/navigation";

type SidebarProps = {
  activePath?: string;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ activePath, open, onClose }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-secondary/96 px-4 py-5 shadow-glass backdrop-blur-xl transition-transform duration-300 md:translate-x-0 md:bg-secondary/70 md:shadow-glass",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between md:justify-start">
          <Link href="/" className="group flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-neon transition group-hover:shadow-glow">
              <span className="font-mono text-lg font-semibold">R</span>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-wide text-text">
                ResQNova
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-text/50">
                Command Center
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-text/70 transition hover:border-primary/30 hover:text-primary md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {sidebarNavItems.map((item) => {
            const isActive = activePath === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300",
                  isActive
                    ? "border border-primary/25 bg-primary/10 text-primary shadow-glow"
                    : "border border-transparent text-text/70 hover:border-primary/20 hover:bg-white/5 hover:text-text hover:shadow-neon",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-text/50">
            Foundation
          </p>
          <p className="mt-2 text-sm leading-6 text-text/75">
            Ready for future emergency response modules, mapping, and AI-driven
            coordination.
          </p>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-background/75 backdrop-blur-sm md:hidden"
        />
      ) : null}
    </>
  );
}
