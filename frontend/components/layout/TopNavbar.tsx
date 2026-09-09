"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/client";

type TopNavbarProps = {
  title: string;
  description?: string;
  onMenuClick: () => void;
};

export function TopNavbar({
  title,
  description,
  onMenuClick,
}: TopNavbarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const { error } = await createClient().auth.signOut();
    if (error) {
      setSigningOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-glass backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-text/80 transition hover:border-primary/30 hover:text-primary md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-lg font-semibold text-text md:text-2xl">
              {title}
            </h1>
            <StatusBadge tone="accent">Foundation Ready</StatusBadge>
          </div>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-text/65">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.26em] text-text/60 md:flex">
          <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_18px_rgba(34,197,94,0.75)]" />
          Ready
        </div>
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-text/70 transition hover:border-primary/30 hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger/80 transition hover:border-danger/50 hover:bg-danger/10 hover:text-danger disabled:cursor-wait disabled:opacity-50"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden lg:inline">{signingOut ? "Signing out" : "Sign out"}</span>
        </button>
      </div>
    </header>
  );
}
