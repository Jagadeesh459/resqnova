import { createClient } from "@/lib/supabase/client";

export type DashboardMetricKey =
  | "high_risk_zones"
  | "ready_ambulances"
  | "ready_rescue_teams"
  | "available_shelter_capacity";

export type DashboardMetrics = Record<DashboardMetricKey, number> & {
  forecast_status: string;
  resource_readiness: string;
  evacuation_readiness: string;
};

const defaults: DashboardMetrics = { high_risk_zones: 0, ready_ambulances: 0, ready_rescue_teams: 0, available_shelter_capacity: 0, forecast_status: "Monitoring", resource_readiness: "Planning", evacuation_readiness: "Planning" };

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_preparedness_metrics");
  if (error) throw error;
  return { ...defaults, ...(data as Partial<DashboardMetrics> | null) };
}

export function subscribeToDashboardMetrics(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase.channel("preparedness-metrics");
  ["ambulances", "rescue_teams", "shelters", "risk_zones", "forecast_scenarios"].forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}
