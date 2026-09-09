import { createClient } from "@/lib/supabase/client";

export type IncidentRecord = {
  id: string;
  title: string;
  description?: string;
  disaster_type: string;
  latitude: number;
  longitude: number;
  district: string;
  priority: number;
  confidence: number;
  status: string;
  assigned_rescue_team: string | null;
  assigned_ambulance: string | null;
  assigned_hospital: string | null;
  assigned_shelter: string | null;
  created_at?: string;
};

export type CitizenRequestRecord = {
  id: string;
  request_id: string;
  citizen_id: string;
  citizen_name?: string;
  latitude: number;
  longitude: number;
  people_count: number;
  emergency_type: string;
  risk_level: string;
  ai_confidence: number;
  priority_score: number;
  status: string;
  rescue_team_id: string | null;
  ambulance_id: string | null;
  eta: string | null;
  created_at?: string;
};

export type RescueTeamRecord = {
  id: string;
  team_name: string;
  leader: string;
  latitude: number;
  longitude: number;
  status: string;
  assigned_incident: string | null;
  heading?: number | null;
  updated_at?: string;
  personnel?: number;
  equipment?: string[];
  readiness?: string;
  team_type?: string;
};

export type AmbulanceRecord = {
  id: string;
  vehicle_code: string;
  latitude: number;
  longitude: number;
  status: string;
  assigned_incident: string | null;
  eta?: string | null;
  updated_at?: string;
  deployment_zone?: string;
  crew_size?: number;
  fuel?: number;
};

export type ShelterRecord = {
  id: string;
  shelter_name: string;
  district: string;
  latitude: number;
  longitude: number;
  capacity: number;
  available_capacity: number;
  food_stock: number;
  medical_stock: number;
  occupancy?: number;
  water_stock?: number;
  power_backup?: boolean;
  updated_at?: string;
};

export type HospitalRecord = {
  id: string;
  hospital_name: string;
  district: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  emergency_capacity: number;
  icu_beds?: number;
  ambulances_available?: number;
  updated_at?: string;
};

export type RoadRecord = {
  id: string;
  road_name: string;
  district: string;
  status: string;
  blocked_reason: string | null;
  travel_time?: number | null;
  risk_score?: number | null;
  name?: string | null;
  start_lat?: number | null;
  start_lng?: number | null;
  end_lat?: number | null;
  end_lng?: number | null;
  road_type?: string | null;
  updated_at?: string;
};

export type RiskZoneRecord = {
  id: string;
  zone_name: string;
  risk_level: string;
  risk_score: number;
  polygon: { coordinates?: number[][][] };
};

export type DeploymentZoneRecord = {
  id: string;
  zone_name: string;
  ready_units: number;
  capacity: number;
  coverage: number;
  polygon: { coordinates?: number[][][] };
};

export type MapData = {
  incidents: IncidentRecord[];
  citizenRequests: CitizenRequestRecord[];
  rescueTeams: RescueTeamRecord[];
  ambulances: AmbulanceRecord[];
  shelters: ShelterRecord[];
  hospitals: HospitalRecord[];
  roads: RoadRecord[];
  riskZones: RiskZoneRecord[];
  deploymentZones: DeploymentZoneRecord[];
};

export const VIJAYAWADA_BOUNDS = { south: 16.45, north: 16.60, west: 80.58, east: 80.73 };
function inVijayawada(record: { latitude: number; longitude: number }) {
  return record.latitude >= VIJAYAWADA_BOUNDS.south && record.latitude <= VIJAYAWADA_BOUNDS.north && record.longitude >= VIJAYAWADA_BOUNDS.west && record.longitude <= VIJAYAWADA_BOUNDS.east;
}

export async function fetchMapData(): Promise<MapData> {
  const supabase = createClient();
  const [{ data, error }, { data: riskZones }, { data: deploymentZones }, { data: citizenRequests }] = await Promise.all([
    supabase.rpc("get_public_map_data"),
    supabase.from("flood_risk").select("id,zone_name,risk_level,risk_score,polygon").eq("district", "NTR"),
    supabase.from("deployment_zones").select("id,zone_name,ready_units,capacity,coverage,polygon").eq("district", "NTR"),
    supabase.from("citizen_requests").select("id,request_id,citizen_id,latitude,longitude,people_count,emergency_type,risk_level,ai_confidence,priority_score,status,rescue_team_id,ambulance_id,eta,created_at,users:citizen_id(full_name)").order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  const result = data as Partial<MapData>;

  return {
    incidents: (result.incidents ?? []).filter(inVijayawada),
    citizenRequests: (citizenRequests ?? []).filter((request) => !["resolved", "cancelled"].includes(request.status)).filter(inVijayawada).sort((a, b) => Number(b.priority_score) - Number(a.priority_score)).map((request) => ({ ...request, citizen_name: Array.isArray(request.users) ? request.users[0]?.full_name : undefined })) as CitizenRequestRecord[],
    rescueTeams: (result.rescueTeams ?? []).filter(inVijayawada),
    ambulances: (result.ambulances ?? []).filter(inVijayawada),
    shelters: (result.shelters ?? []).filter(inVijayawada),
    hospitals: (result.hospitals ?? []).filter(inVijayawada),
    roads: (result.roads ?? []).filter((road) => (road.start_lat != null && road.start_lng != null && road.end_lat != null && road.end_lng != null) && (inVijayawada({ latitude: road.start_lat, longitude: road.start_lng }) || inVijayawada({ latitude: road.end_lat, longitude: road.end_lng }))),
    riskZones: (riskZones ?? []).filter((zone) => !/mylavaram/i.test(zone.zone_name)) as RiskZoneRecord[],
    deploymentZones: (deploymentZones ?? []).filter((zone) => !/mylavaram/i.test(zone.zone_name)) as DeploymentZoneRecord[],
  };
}

const liveTables = ["ambulances", "rescue_teams", "hospitals", "shelters", "roads", "risk_zones", "deployment_zones", "citizen_requests", "rescue_missions", "request_assignments", "notifications"] as const;

export function subscribeToMapChanges(onChange: () => void) {
  const supabase = createClient();
  // Keep every consumer on its own channel; Supabase rejects callbacks added
  // to a channel that has already subscribed.
  const channel = supabase.channel(`vijayawada-digital-twin-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  liveTables.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}
