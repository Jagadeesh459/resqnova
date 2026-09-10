import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Point = { latitude: number; longitude: number };
type Road = { status: string; travel_time?: number | null; risk_score?: number | null };
type Resource = Point & { id: string; status: string; manager_auth_id?: string | null; [key: string]: unknown };
type AiDecision = {
  riskScore: number;
  confidence: number;
  priority: "Low" | "Moderate" | "High" | "Critical";
  dispatchRescue: boolean;
  dispatchAmbulance: boolean;
  recommendedShelter?: string | null;
  reason: string;
};

function distanceKm(a: Point, b: Point) {
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat = a.latitude * Math.PI / 180;
  const nextLat = b.latitude * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat) * Math.cos(nextLat);
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function pointInPolygon(point: Point, polygon: { coordinates?: number[][][] } | null) {
  const ring = polygon?.coordinates?.[0] ?? [];
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index] ?? [];
    const [previousX, previousY] = ring[previous] ?? [];
    if ((y > point.latitude) !== (previousY > point.latitude) && point.longitude < ((previousX - x) * (point.latitude - y)) / (previousY - y) + x) inside = !inside;
  }
  return inside;
}

function baselineRisk(request: { people_count: number; children_count?: number; elderly_count?: number; emergency_type: string }, point: Point, zones: Array<{ risk_score?: number; polygon?: { coordinates?: number[][][] } }>, roads: Road[]) {
  const localZone = zones.find((zone) => pointInPolygon(point, zone.polygon ?? null));
  const zoneScore = Math.max(35, Number(localZone?.risk_score) || 35);
  const peopleScore = Math.min(25, Math.max(0, request.people_count - 1) * 4);
  const vulnerableScore = Math.min(18, (request.children_count ?? 0) * 5 + (request.elderly_count ?? 0) * 5);
  const medicalScore = /medical|injury|ambulance|breath|cardiac|oxygen/i.test(request.emergency_type) ? 20 : 0;
  const blocked = roads.filter((road) => road.status === "blocked");
  const roadScore = blocked.length ? Math.min(16, 8 + blocked.length * 2 + Math.max(...blocked.map((road) => Number(road.risk_score) || 0), 0) * 0.08) : 0;
  return Math.round(Math.min(100, zoneScore + peopleScore + vulnerableScore + medicalScore + roadScore));
}

function priorityFor(score: number): AiDecision["priority"] {
  return score >= 90 ? "Critical" : score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";
}

function normalizeDecision(value: Partial<AiDecision>, request: { people_count: number; emergency_type: string }, baselineScore: number): AiDecision {
  const modelScore = Number.isFinite(Number(value.riskScore)) ? Number(value.riskScore) : baselineScore;
  const riskScore = Math.round(Math.max(0, Math.min(100, baselineScore * 0.7 + modelScore * 0.3)));
  const modelConfidence = Number.isFinite(Number(value.confidence)) ? Number(value.confidence) : 70;
  const confidence = Math.round(Math.max(55, Math.min(98, modelConfidence * 0.35 + 65)));
  const medical = /medical|injury|ambulance|breath|cardiac|oxygen/i.test(request.emergency_type);
  return {
    riskScore,
    confidence,
    priority: priorityFor(riskScore),
    dispatchRescue: true,
    dispatchAmbulance: Boolean(value.dispatchAmbulance) || medical || request.people_count >= 4 || riskScore >= 70,
    recommendedShelter: value.recommendedShelter ?? null,
    reason: value.reason || `${request.people_count} people reported ${request.emergency_type} in the Vijayawada operational area.`,
  };
}

function roadPenalty(roads: Road[]) {
  if (!roads.length) return 1;
  const blocked = roads.filter((road) => road.status === "blocked").length;
  const restricted = roads.filter((road) => road.status === "restricted" || road.status === "slow").length;
  const risk = roads.reduce((total, road) => total + Number(road.risk_score || 0), 0) / roads.length;
  return 1 + blocked * 0.3 + restricted * 0.1 + Math.min(0.5, risk / 200);
}

function selectNearest<T extends Resource>(origin: Point, resources: T[], roads: Road[]) {
  const penalty = roadPenalty(roads);
  return [...resources].sort((a, b) => distanceKm(origin, a) * penalty - distanceKm(origin, b) * penalty)[0];
}

function estimatedEta(origin: Point, destination: Point, roads: Road[]) {
  const averageRoadMinutes = roads.length ? roads.reduce((total, road) => total + Number(road.travel_time || 0), 0) / roads.length : 8;
  return Math.max(4, Math.round(distanceKm(origin, destination) * 4 * roadPenalty(roads) + averageRoadMinutes * 0.25));
}

function parseModelJson(text: string) {
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "")) as Partial<AiDecision>;
}

async function evaluateWithGemini(input: Record<string, unknown>, request: { people_count: number; emergency_type: string }, baselineScore: number) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { decision: normalizeDecision({}, request, baselineScore), source: "heuristic_fallback" };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `You are the ResQNova Vijayawada emergency triage engine. Return only JSON with exactly these keys: riskScore (0-100), confidence (0-100), priority, dispatchRescue (boolean), dispatchAmbulance (boolean), recommendedShelter (string or null), reason (short). Never invent resources. Respect the deterministic baseline risk and prioritize children, elderly, injuries, flood severity, people count, blocked roads, and response distance. Baseline risk: ${baselineScore}. Input: ${JSON.stringify(input)}` }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini evaluation failed with status ${response.status}`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty evaluation.");
  return { decision: normalizeDecision(parseModelJson(text), request, baselineScore), source: "gemini" };
}

export async function POST(request: Request) {
  let supabase: any = null;
  let requestId: string | undefined;
  try {
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const body = await request.json() as { requestId?: string };
    requestId = body.requestId;
    if (!requestId) return NextResponse.json({ error: "requestId is required." }, { status: 400 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Dispatch service is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server." }, { status: 503 });
    supabase = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: requestRow, error: requestError } = await supabase.from("citizen_requests").select("*").eq("id", requestId).single();
    if (requestError || !requestRow) return NextResponse.json({ error: requestError?.message || "Request not found." }, { status: 404 });
    if (["resolved", "cancelled"].includes(requestRow.status) || ["assigned", "notified"].includes(requestRow.ai_stage)) return NextResponse.json({ requestId, status: requestRow.status, message: "This request has already been processed." });

    const log = async (step: string, status: "pending" | "success" | "failed", details: Record<string, unknown> = {}) => { await supabase?.from("ai_execution_logs").insert({ request_id: requestId, step, status, details }); };
    await log("sos_received", "success", { requestCode: requestRow.request_id });
    await supabase.from("citizen_requests").update({ ai_stage: "processing", ai_error: null }).eq("id", requestId);
    await log("ai_triggered", "success", { model: process.env.GEMINI_API_KEY ? "gemini-2.0-flash" : "heuristic_fallback" });

    const [{ data: rescueTeams }, { data: ambulances }, { data: shelters }, { data: hospitals }, { data: roads }, { data: zones }] = await Promise.all([
      supabase.from("rescue_teams").select("id,manager_auth_id,latitude,longitude,status,team_name,personnel,equipment,readiness,team_type").in("status", ["available", "standby"]).is("assigned_request_id", null),
      supabase.from("ambulances").select("id,manager_auth_id,latitude,longitude,status,vehicle_code,crew_size,fuel").eq("status", "available").is("assigned_request_id", null),
      supabase.from("shelters").select("id,shelter_name,available_capacity,capacity,occupancy,latitude,longitude,food_stock,water_stock,power_backup").gt("available_capacity", 0),
      supabase.from("hospitals").select("id,hospital_name,available_beds,emergency_capacity,latitude,longitude,icu_beds,ambulances_available").gt("available_beds", 0),
      supabase.from("roads").select("road_name,status,travel_time,risk_score,blocked_reason").eq("district", "NTR").limit(100),
      supabase.from("flood_risk").select("zone_name,risk_level,risk_score,polygon").eq("district", "NTR"),
    ]);
    const point = { latitude: Number(requestRow.latitude), longitude: Number(requestRow.longitude) };
    const roadRows = (roads ?? []) as Road[];
    const riskRows = (zones ?? []) as Array<{ risk_level: string; risk_score: number; polygon?: { coordinates?: number[][][] } }>;
    const baselineScore = baselineRisk(requestRow, point, riskRows, roadRows);
    await supabase.from("citizen_requests").update({ risk_score: baselineScore }).eq("id", requestId);
    await log("risk_calculated", "success", { baselineScore, blockedRoads: roadRows.filter((road) => road.status === "blocked").length });

    const nearestRescue = selectNearest(point, (rescueTeams ?? []) as Resource[], roadRows) as (Resource & { team_name?: string }) | undefined;
    const nearestAmbulance = selectNearest(point, (ambulances ?? []) as Resource[], roadRows) as (Resource & { vehicle_code?: string }) | undefined;
    const suitableShelters = ((shelters ?? []) as Array<Resource & { available_capacity: number; shelter_name?: string }>).filter((item) => Number(item.available_capacity) >= Number(requestRow.people_count));
    const nearestShelter = selectNearest(point, suitableShelters as Resource[], roadRows) as (Resource & { shelter_name?: string }) | undefined;
    const nearestHospital = selectNearest(point, (hospitals ?? []) as Resource[], roadRows) as (Resource & { hospital_name?: string }) | undefined;

    let evaluated: { decision: AiDecision; source: string };
    try {
      evaluated = await evaluateWithGemini({ location: "Vijayawada", coordinates: point, people: requestRow.people_count, children: requestRow.children_count, elderly: requestRow.elderly_count, emergency: requestRow.emergency_type, nearestRescueTeams: rescueTeams ?? [], nearestAmbulances: ambulances ?? [], nearestShelters: shelters ?? [], nearestHospitals: hospitals ?? [], roadStatus: roadRows, riskZones: riskRows }, requestRow, baselineScore);
    } catch {
      evaluated = { decision: normalizeDecision({}, requestRow, baselineScore), source: "heuristic_fallback" };
    }
    const decision = evaluated.decision;
    const medical = /medical|injury|ambulance|breath|cardiac|oxygen/i.test(requestRow.emergency_type);
    const assignRescue = decision.dispatchRescue && Boolean(nearestRescue);
    const assignAmbulance = decision.dispatchAmbulance && Boolean(nearestAmbulance);
    const assignShelter = Boolean(nearestShelter) && (decision.riskScore >= 60 || requestRow.people_count >= 4 || /water|flood|elderly|evacuation/i.test(requestRow.emergency_type));
    const shelter = assignShelter ? nearestShelter : suitableShelters[0] as (Resource & { shelter_name?: string }) | undefined;
    const etaMinutes = assignRescue ? estimatedEta(point, nearestRescue!, roadRows) : assignAmbulance ? estimatedEta(point, nearestAmbulance!, roadRows) : null;
    const now = new Date().toISOString();

    const riskLevel = decision.priority === "Critical" ? "critical" : decision.priority === "High" ? "high" : decision.priority === "Moderate" ? "moderate" : "safe";
    const { error: updateError } = await supabase.from("citizen_requests").update({ risk_level: riskLevel, risk_score: decision.riskScore, ai_confidence: decision.confidence, priority_score: decision.riskScore, ai_reason: decision.reason, ai_recommendation: shelter ? `Use ${shelter.shelter_name ?? "the nearest available shelter"}` : decision.reason, ai_processed_at: now, ai_dispatch_rescue: assignRescue, ai_dispatch_ambulance: assignAmbulance, recommended_shelter_id: shelter?.id ?? null, recommended_hospital_id: medical ? nearestHospital?.id ?? null : null, ai_input: { location: point, people: requestRow.people_count, emergency: requestRow.emergency_type, baselineScore }, ai_output: { ...decision, selectedRescue: nearestRescue?.id ?? null, selectedAmbulance: nearestAmbulance?.id ?? null, selectedShelter: shelter?.id ?? null, selectedHospital: nearestHospital?.id ?? null, etaMinutes }, dispatch_source: evaluated.source, status: assignRescue || assignAmbulance ? "assigned" : "pending", rescue_team_id: assignRescue ? nearestRescue!.id : null, ambulance_id: assignAmbulance ? nearestAmbulance!.id : null, assigned_at: assignRescue || assignAmbulance ? now : null, eta: etaMinutes ? new Date(Date.now() + etaMinutes * 60000).toISOString() : null, ai_stage: "risk_calculated" }).eq("id", requestId);
    if (updateError) throw updateError;

    if (assignRescue) {
      const { error } = await supabase.from("rescue_teams").update({ assigned_request_id: requestId, status: "deployed", updated_at: now }).eq("id", nearestRescue!.id).is("assigned_request_id", null);
      if (error) throw error;
      const { error: missionError } = await supabase.from("rescue_missions").upsert({ request_id: requestId, rescue_team_id: nearestRescue!.id, ambulance_id: assignAmbulance ? nearestAmbulance!.id : null, latitude: point.latitude, longitude: point.longitude, mission_status: "assigned", readiness: "ready", last_updated: now }, { onConflict: "request_id" });
      if (missionError) throw missionError;
      await log("rescue_assigned", "success", { teamId: nearestRescue!.id, teamName: nearestRescue!.team_name, etaMinutes });
    } else await log("rescue_assigned", "failed", { reason: "No available rescue team." });
    if (assignAmbulance) {
      const { error } = await supabase.from("ambulances").update({ assigned_request_id: requestId, status: "dispatched", updated_at: now }).eq("id", nearestAmbulance!.id).is("assigned_request_id", null);
      if (error) throw error;
      await log("ambulance_assigned", "success", { ambulanceId: nearestAmbulance!.id, vehicleCode: nearestAmbulance!.vehicle_code, etaMinutes });
    } else if (decision.dispatchAmbulance) await log("ambulance_assigned", "failed", { reason: "No available ambulance." });
    if (assignShelter) await log("shelter_assigned", "success", { shelterId: shelter?.id, shelterName: shelter?.shelter_name });
    else await log("shelter_assigned", "failed", { reason: "No shelter with sufficient capacity." });

    if (assignRescue || assignAmbulance || assignShelter) {
      const { error } = await supabase.from("request_assignments").upsert({ request_id: requestId, rescue_team_id: assignRescue ? nearestRescue!.id : null, ambulance_id: assignAmbulance ? nearestAmbulance!.id : null, shelter_id: assignShelter ? shelter?.id : null, priority_score: decision.riskScore, status: "assigned", eta: etaMinutes ? new Date(Date.now() + etaMinutes * 60000).toISOString() : null, updated_at: now }, { onConflict: "request_id" });
      if (error) throw error;
    }

    const notificationRows: Array<{ user_id: string; citizen_id: string; title: string; message: string; type: string }> = [{ user_id: requestRow.citizen_id, citizen_id: requestId, title: "AI triage complete", message: `${decision.priority} priority. ${assignRescue ? "Rescue team assigned." : "Awaiting rescue availability."} ${assignShelter ? `Shelter: ${shelter?.shelter_name}.` : "Shelter recommendation pending."}`, type: "ai_update" }];
    const managerAuthIds = [assignRescue ? nearestRescue?.manager_auth_id : null, assignAmbulance ? nearestAmbulance?.manager_auth_id : null].filter((id): id is string => Boolean(id));
    if (managerAuthIds.length) {
      const { data: profiles } = await supabase.from("users").select("id").in("auth_id", managerAuthIds);
      (profiles as Array<{ id: string }> ?? []).forEach((profile) => notificationRows.push({ user_id: profile.id, citizen_id: requestId!, title: "New dispatch assignment", message: `${decision.priority} priority request ${requestRow.request_id} requires response.`, type: "dispatch" }));
    }
    if (notificationRows.length) await supabase.from("notifications").insert(notificationRows);
    await supabase.from("citizen_requests").update({ ai_stage: "notified" }).eq("id", requestId);
    await log("notifications_sent", "success", { count: notificationRows.length });
    return NextResponse.json({ requestId, requestCode: requestRow.request_id, decision, dispatchSource: evaluated.source, assignedRescueTeam: nearestRescue?.team_name ?? null, assignedAmbulance: nearestAmbulance?.vehicle_code ?? null, recommendedShelter: shelter?.shelter_name ?? null, recommendedHospital: nearestHospital?.hospital_name ?? null, etaMinutes, status: assignRescue || assignAmbulance ? "assigned" : "pending" });
  } catch (error) {
    if (supabase && requestId) {
      await supabase.from("citizen_requests").update({ ai_stage: "failed", ai_error: error instanceof Error ? error.message : "AI dispatch failed." }).eq("id", requestId);
      await supabase.from("ai_execution_logs").insert({ request_id: requestId, step: "failed", status: "failed", details: { error: error instanceof Error ? error.message : "AI dispatch failed." } });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI dispatch failed." }, { status: 500 });
  }
}
