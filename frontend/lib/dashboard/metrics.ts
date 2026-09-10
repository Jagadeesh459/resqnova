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

export async function dispatchPendingCitizenRequests() {
  const supabase = createClient();
  const { data: requests, error } = await supabase
    .from("citizen_requests")
    .select("id")
    .eq("status", "pending")
    .eq("ai_stage", "received")
    .order("created_at", { ascending: true })
    .limit(10);
  if (error) throw error;

  await Promise.all((requests ?? []).map(async (request) => {
    await fetch("/api/ai/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    });
  }));
}

export function subscribeToDashboardMetrics(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase.channel("preparedness-metrics");
  ["ambulances", "rescue_teams", "shelters", "risk_zones", "forecast_scenarios", "citizen_requests", "request_assignments"].forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}
