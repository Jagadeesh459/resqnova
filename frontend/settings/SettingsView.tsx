import { Settings } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";

export function SettingsView() {
  return (
    <AppShell
      title="Settings"
      description="Foundation-only settings surface for future configuration work."
      activePath="/settings"
    >
      <GlassCard className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <p className="font-heading text-xl font-semibold">Settings</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-text/70">
              Reserved for app preferences, integrations, and environment setup.
            </p>
          </div>
          <StatusBadge tone="neutral">Foundation</StatusBadge>
        </div>
      </GlassCard>
    </AppShell>
  );
}
