import { Home } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";

export function ShelterView() {
  return (
    <AppShell
      title="Shelter"
      description="Placeholder workspace for shelter availability and future placement."
      activePath="/shelter"
    >
      <GlassCard className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <p className="font-heading text-xl font-semibold">Shelter</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-text/70">
              Reserved for shelter inventory and capacity planning.
            </p>
          </div>
          <StatusBadge tone="success">Structure only</StatusBadge>
        </div>
      </GlassCard>
    </AppShell>
  );
}
