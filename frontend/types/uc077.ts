export const NTR_OPERATIONAL_DISTRICT = "NTR" as const;

export type PreparednessStatus = "Ready" | "Staged" | "Monitoring" | "Planning";

export type PreparednessOverview = {
  forecast_status: PreparednessStatus;
  resource_readiness: PreparednessStatus;
  evacuation_readiness: PreparednessStatus;
};

export const NTR_FOCUS_LOCATIONS = [
  "Vijayawada",
  "Benz Circle",
  "Governorpet",
  "Railway Station",
  "Kanaka Durga Bridge",
  "Bhavanipuram",
] as const;
