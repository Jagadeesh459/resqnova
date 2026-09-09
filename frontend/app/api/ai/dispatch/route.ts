import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Resource = { id: string; manager_auth_id: string | null; latitude: number; longitude: number; status: string; team_name?: string; vehicle_code?: string };
type AiDecision = { riskScore: number; confidence: number; priority: string; dispatchRescue: boolean; dispatchAmbulance: boolean; recommendedShelter?: string; reason: string };

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat = a.latitude * Math.PI / 180;
  const nextLat = b.latitude * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat) * Math.cos(nextLat);
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function normalizeDecision(value: Partial<AiDecision>, request: { people_count: number; emergency_type: string; risk_level: string }, baselineScore: number): AiDecision {
  const modelScore = Number.isFinite(Number(value.riskScore)) ? Number(value.riskScore) : baselineScore;
  const score = Math.round(Math.max(0, Math.min(100, baselineScore * 0.7 + modelScore * 0.3)));
  const modelConfidence = Number.isFinite(Number(value.confidence)) ? Number(value.confidence) : 68;
  const confidence = Math.round(Math.max(55, Math.min(98, modelConfidence * 0.35 + 65)));
  const priority = score >= 90 ? "Critical" : score >= 70 ? "High" : score >= 40 ? "Moderate" : "Low";
  const medical = /medical|injury|ambulance|breath|cardiac/i.test(request.emergency_type);
  return {
    riskScore: score,
    confidence,
    priority,
    dispatchRescue: true,
    dispatchAmbulance: medical || request.people_count >= 4 || score >= 70,
    recommendedShelter: value.recommendedShelter,
    reason: value.reason || `${request.people_count} people reported ${request.emergency_type} in a ${request.risk_level} operational area.`,
  };
}

async function evaluateWithGemini(input: Record<string, unknown>, request: { people_count: number; emergency_type: string; risk_level: string }, baselineScore: number) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { decision: normalizeDecision({}, request, baselineScore), source: "heuristic_fallback" };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `Return only valid JSON. Evaluate this Vijayawada emergency request using flood risk, people count, medical need, road access, and resource distance. Keys: riskScore (0-100), confidence (0-100), priority, dispatchRescue (boolean), dispatchAmbulance (boolean), recommendedShelter (string or null), reason (short string). Input: ${JSON.stringify(input)}` }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini evaluation failed with status ${response.status}`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  if (!raw) throw new Error("Gemini returned an empty evaluation.");
  return { decision: normalizeDecision(JSON.parse(raw) as Partial<AiDecision>, request, baselineScore), source: "gemini" };
}

function pointInPolygon(point: { latitude: number; longitude: number }, polygon: { coordinates?: number[][][] } | null) {
  const ring = polygon?.coordinates?.[0] ?? [];
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index] ?? [];
    const [previousX, previousY] = ring[previous] ?? [];
    if ((y > point.latitude) !== (previousY > point.latitude) && point.longitude < ((previousX - x) * (point.latitude - y)) / (previousY - y) + x) inside = !inside;
  }
  return inside;
}

function calculateBaselineScore(request: { people_count: number; emergency_type: string }, point: { latitude: number; longitude: number }, riskZones: Array<{ risk_level: string; risk_score: number; polygon?: { coordinates?: number[][][] } }>, roads: Array<{ status: string; risk_score?: number | null }>) {
  const localZone = riskZones.find((zone) => pointInPolygon(point, zone.polygon ?? null));
  const zoneScore = localZone ? Number(localZone.risk_score) || 35 : 35;
  const peopleScore = Math.min(25, Math.max(0, request.people_count - 1) * 4);
  const medicalScore = /medical|injury|ambulance|breath|cardiac/i.test(request.emergency_type) ? 18 : 0;
  const blockedRoadScore = roads.some((road) => road.status === "blocked") ? 12 : 0;
  const roadScore = roads.filter((road) => road.status === "blocked").reduce((highest, road) => Math.max(highest, Number(road.risk_score) || 0), 0);
  return Math.round(Math.min(100, zoneScore + peopleScore + medicalScore + blockedRoadScore + roadScore * 0.15));
}

export async function POST(request: Request) {
  try {
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const body = await request.json() as { requestId?: string };
    if (!body.requestId) return NextResponse.json({ error: "requestId is required." }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Dispatch service is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server." }, { status: 503 });
    const supabase = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const [{ data: requestRow, error: requestError }, { data: rescueTeams }, { data: ambulances }, { data: shelters }, { data: roads }, { data: zones }] = await Promise.all([
      supabase.from("citizen_requests").select("*").eq("id", body.requestId).single(),
      supabase.from("rescue_teams").select("id,manager_auth_id,latitude,longitude,status,team_name").in("status", ["available", "standby"]).is("assigned_request_id", null),
      supabase.from("ambulances").select("id,manager_auth_id,latitude,longitude,status,vehicle_code").eq("status", "available").is("assigned_request_id", null),
      supabase.from("shelters").select("id,shelter_name,available_capacity,latitude,longitude").gt("available_capacity", 0),
      supabase.from("roads").select("road_name,status,travel_time,risk_score,blocked_reason").eq("district", "NTR").limit(30),
      supabase.from("flood_risk").select("zone_name,risk_level,risk_score,polygon").eq("district", "NTR"),
    ]);
    if (requestError || !requestRow) return NextResponse.json({ error: requestError?.message || "Request not found." }, { status: 404 });

    const point = { latitude: requestRow.latitude, longitude: requestRow.longitude };
    const nearestRescue = ((rescueTeams ?? []) as Resource[]).sort((a, b) => distanceKm(point, a) - distanceKm(point, b))[0];
    const nearestAmbulance = ((ambulances ?? []) as Resource[]).sort((a, b) => distanceKm(point, a) - distanceKm(point, b))[0];
    const nearestShelter = (shelters ?? []).filter((item) => item.available_capacity >= requestRow.people_count).sort((a, b) => distanceKm(point, a) - distanceKm(point, b))[0];
    const baselineScore = calculateBaselineScore(requestRow, point, (zones ?? []) as Array<{ risk_level: string; risk_score: number; polygon?: { coordinates?: number[][][] } }>, (roads ?? []) as Array<{ status: string; risk_score?: number | null }>);
    let evaluated: { decision: AiDecision; source: string };
    try {
      evaluated = await evaluateWithGemini({ location: point, people: requestRow.people_count, emergency: requestRow.emergency_type, baselineRiskScore: baselineScore, nearestRescueTeams: rescueTeams, nearestAmbulances: ambulances, nearestShelters: shelters, roadStatus: roads, riskZones: zones }, requestRow, baselineScore);
    } catch {
      evaluated = { decision: normalizeDecision({}, requestRow, baselineScore), source: "heuristic_fallback" };
    }
    const decision = evaluated.decision;
    const assignAmbulance = decision.dispatchAmbulance && Boolean(nearestAmbulance);
    const assignRescue = decision.dispatchRescue && Boolean(nearestRescue);
    const assignShelter = Boolean(nearestShelter) && (decision.riskScore >= 70 || requestRow.people_count >= 4);
    const nextStatus = assignRescue || assignAmbulance ? "assigned" : "pending";

    const { error: updateError } = await supabase.from("citizen_requests").update({
      risk_level: decision.priority === "Critical" ? "critical" : decision.priority === "High" ? "high" : decision.priority === "Moderate" ? "moderate" : "safe", ai_confidence: decision.confidence, priority_score: decision.riskScore,
      ai_reason: decision.reason, ai_recommendation: decision.recommendedShelter ? `Use ${decision.recommendedShelter}` : decision.reason,
      ai_processed_at: new Date().toISOString(), ambulance_required: decision.dispatchAmbulance,
      dispatch_source: evaluated.source, status: nextStatus, rescue_team_id: assignRescue ? nearestRescue.id : null,
      ambulance_id: assignAmbulance ? nearestAmbulance.id : null, shelter_id: assignShelter ? nearestShelter.id : null,
      eta: assignRescue ? new Date(Date.now() + Math.max(5, Math.round(distanceKm(point, nearestRescue) * 4)) * 60000).toISOString() : null,
    }).eq("id", requestRow.id);
    if (updateError) throw updateError;

    if (assignRescue) {
      const { error: rescueUpdateError } = await supabase.from("rescue_teams").update({ assigned_request_id: requestRow.id, status: "deployed", updated_at: new Date().toISOString() }).eq("id", nearestRescue.id);
      if (rescueUpdateError) throw rescueUpdateError;
      const { error: missionError } = await supabase.from("rescue_missions").upsert({ request_id: requestRow.id, rescue_team_id: nearestRescue.id, ambulance_id: assignAmbulance ? nearestAmbulance.id : null, latitude: requestRow.latitude, longitude: requestRow.longitude, mission_status: "assigned", readiness: "ready", last_updated: new Date().toISOString() }, { onConflict: "request_id" });
      if (missionError) throw missionError;
    }
    if (assignAmbulance) {
      const { error: ambulanceUpdateError } = await supabase.from("ambulances").update({ assigned_request_id: requestRow.id, status: "dispatched", updated_at: new Date().toISOString() }).eq("id", nearestAmbulance.id);
      if (ambulanceUpdateError) throw ambulanceUpdateError;
    }

    const notificationRows = [{ user_id: requestRow.citizen_id, citizen_id: requestRow.id, title: "AI triage complete", message: `${decision.priority} priority. ${assignRescue ? "A rescue team has been assigned." : "Your request is pending resource assignment."}`, type: "ai_update" }];
    const managerAuthIds = [assignRescue ? nearestRescue.manager_auth_id : null, assignAmbulance ? nearestAmbulance.manager_auth_id : null].filter(Boolean);
    if (managerAuthIds.length) {
      const { data: responderProfiles } = await supabase.from("users").select("id").in("auth_id", managerAuthIds);
      (responderProfiles ?? []).forEach((profile) => notificationRows.push({ user_id: profile.id, citizen_id: requestRow.id, title: "New dispatch assignment", message: `${decision.priority} priority request ${requestRow.request_id} requires response.`, type: "dispatch" }));
    }
    await supabase.from("notifications").insert(notificationRows);
    return NextResponse.json({ requestId: requestRow.id, requestCode: requestRow.request_id, decision, dispatchSource: evaluated.source, assignedRescueTeam: nearestRescue?.team_name ?? null, assignedAmbulance: nearestAmbulance?.vehicle_code ?? null, status: nextStatus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dispatch evaluation failed." }, { status: 500 });
  }
}
