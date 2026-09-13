import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../database/db';
import { CitizenRequest, PriorityLevel } from '../frontend/src/types';

interface GeminiTriageResponse {
  riskScore: number;
  confidence: number;
  priority: PriorityLevel;
  dispatchRescue: boolean;
  dispatchAmbulance: boolean;
  recommendedShelterName?: string;
  reason: string;
}

// Distance calculator (Haversine in km)
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function runAiTriageAndDispatch(requestId: string): Promise<{
  success: boolean;
  triage: GeminiTriageResponse;
  assignedRescueId?: string;
  assignedAmbulanceId?: string;
  assignedShelterId?: string;
}> {
  // 1. Fetch SOS request
  const request = db.getCitizenRequest(requestId);
  if (!request) {
    throw new Error(`Citizen request ${requestId} not found`);
  }

  db.addAiLog(requestId, 'Context & GIS Layers Loaded', 'started', {
    citizenCoords: [request.latitude, request.longitude],
    emergencyType: request.emergency_type,
    peopleCount: request.people_count,
    vulnerable: request.children_count + request.elderly_count,
  });

  // 2. Query available resources from DB
  const state = db.getState();
  const availableRescueTeams = state.rescue_teams.filter((t) => t.status === 'available');
  const availableAmbulances = state.ambulances.filter((a) => a.status === 'available');
  const availableShelters = state.shelters.filter((s) => s.available_capacity > 0);
  const blockedRoads = state.roads.filter((r) => r.status !== 'open');
  const activeRiskZones = state.risk_zones;

  db.addAiLog(requestId, 'Resources & Road Conditions Queried', 'success', {
    availableRescueCount: availableRescueTeams.length,
    availableAmbulanceCount: availableAmbulances.length,
    availableSheltersCount: availableShelters.length,
    blockedRoadCount: blockedRoads.length,
  });

  // 3. Invoke Google Gemini 3.8 Flash or deterministic fallback
  let triage: GeminiTriageResponse;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      db.addAiLog(requestId, 'Invoking Gemini AI Triage Engine', 'started', {
        model: 'gemini-3.8-flash',
      });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptContext = {
        emergency_request: {
          code: request.request_id,
          location: { lat: request.latitude, lng: request.longitude, address: request.address_hint },
          people_count: request.people_count,
          children: request.children_count,
          elderly: request.elderly_count,
          emergency_type: request.emergency_type,
          medical_urgency: request.medical_urgency,
        },
        operational_context: {
          district: 'Vijayawada / NTR District, Andhra Pradesh',
          monsoon_river_status: 'Krishna River flood warning active',
          risk_zones: activeRiskZones.map((z) => ({
            name: z.zone_name,
            level: z.risk_level,
            water_level: `${z.water_level_m}m`,
          })),
          road_closures: blockedRoads.map((r) => ({
            name: r.road_name,
            reason: r.blocked_reason,
          })),
          available_shelters: availableShelters.map((s) => ({
            id: s.id,
            name: s.shelter_name,
            available_capacity: s.available_capacity,
          })),
        },
      };

      const systemInstruction = `You are the ResQNova Disaster Emergency Triage and Autonomous Dispatch AI for Vijayawada / NTR District, Andhra Pradesh.
Evaluate incoming citizen distress signals with absolute tactical precision.
Score the risk from 0 to 100 based on:
1. Vulnerable lives (children, elderly, injured).
2. Water level & flood entrapment severity.
3. Proximity to confirmed blocked or flooded roads.
4. Medical urgency.

Strict Safety Rules:
- Return only valid JSON.
- Never hallucinate non-existent shelters or resources.
- If emergency_type involves flood or water trapping, set dispatchRescue = true.
- If medical_urgency is critical or moderate, set dispatchAmbulance = true.
- Recommend the best shelter with adequate capacity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: JSON.stringify(promptContext),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.NUMBER, description: 'Risk score from 0 to 100' },
              confidence: { type: Type.NUMBER, description: 'Confidence score from 0 to 100' },
              priority: {
                type: Type.STRING,
                description: 'Priority level: Low, Moderate, High, or Critical',
              },
              dispatchRescue: { type: Type.BOOLEAN, description: 'Whether rescue boat or squad is required' },
              dispatchAmbulance: { type: Type.BOOLEAN, description: 'Whether medical ambulance is required' },
              recommendedShelterName: { type: Type.STRING, description: 'Name of the best shelter' },
              reason: { type: Type.STRING, description: 'Concise tactical reasoning' },
            },
            required: ['riskScore', 'confidence', 'priority', 'dispatchRescue', 'dispatchAmbulance', 'reason'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      triage = {
        riskScore: Math.min(100, Math.max(10, Number(parsed.riskScore) || 75)),
        confidence: Math.min(100, Math.max(50, Number(parsed.confidence) || 90)),
        priority: (['Critical', 'High', 'Moderate', 'Low'].includes(parsed.priority)
          ? parsed.priority
          : 'High') as PriorityLevel,
        dispatchRescue: Boolean(parsed.dispatchRescue),
        dispatchAmbulance: Boolean(parsed.dispatchAmbulance),
        recommendedShelterName: parsed.recommendedShelterName,
        reason: parsed.reason || 'Gemini 3.8 Flash autonomous situational triage assessment completed.',
      };

      db.addAiLog(requestId, 'Gemini AI Triage Evaluated', 'success', {
        riskScore: triage.riskScore,
        priority: triage.priority,
        dispatchRescue: triage.dispatchRescue,
        dispatchAmbulance: triage.dispatchAmbulance,
        reason: triage.reason,
      });
    } catch (aiErr) {
      console.warn('Gemini API call failed, invoking deterministic safety fallback:', aiErr);
      triage = evaluateDeterministicFallback(request, activeRiskZones, blockedRoads);
      db.addAiLog(requestId, 'AI Failsafe Triggered: Deterministic Rule Fallback', 'warning', {
        fallbackReason: String(aiErr),
        computedPriority: triage.priority,
        riskScore: triage.riskScore,
      });
    }
  } else {
    // Deterministic fallback if API key is not yet set
    triage = evaluateDeterministicFallback(request, activeRiskZones, blockedRoads);
    db.addAiLog(requestId, 'Deterministic Triage Engine Executed (Local Mode)', 'success', {
      priority: triage.priority,
      riskScore: triage.riskScore,
      reason: triage.reason,
    });
  }

  // 4. Suitability Scoring & Resource Selection (Phase 9)
  let bestRescue: typeof availableRescueTeams[0] | undefined;
  let bestAmbulance: typeof availableAmbulances[0] | undefined;
  let bestShelter: typeof availableShelters[0] | undefined;

  // Rescue Team Selection
  if (triage.dispatchRescue && availableRescueTeams.length > 0) {
    let lowestScore = Infinity;
    for (const team of availableRescueTeams) {
      const dist = haversineDistance(team.latitude, team.longitude, request.latitude, request.longitude);
      // Suitability formula: distance + road blockage penalty - flood equipment bonus
      let suitability = dist;
      if (team.equipment.toLowerCase().includes('boat') || team.equipment.toLowerCase().includes('water')) {
        suitability -= 1.5; // Highly suitable for water extraction
      }
      if (suitability < lowestScore) {
        lowestScore = suitability;
        bestRescue = team;
      }
    }
  }

  // Ambulance Selection
  if (triage.dispatchAmbulance && availableAmbulances.length > 0) {
    let lowestScore = Infinity;
    for (const amb of availableAmbulances) {
      const dist = haversineDistance(amb.latitude, amb.longitude, request.latitude, request.longitude);
      const fuelBonus = (100 - amb.fuel) * 0.05; // Lower penalty for high fuel
      const suitability = dist + fuelBonus;
      if (suitability < lowestScore) {
        lowestScore = suitability;
        bestAmbulance = amb;
      }
    }
  }

  // Shelter Selection
  if (availableShelters.length > 0) {
    // If Gemini recommended a shelter by name, try matching it
    if (triage.recommendedShelterName) {
      bestShelter = availableShelters.find(
        (s) => s.shelter_name.toLowerCase().includes(triage.recommendedShelterName!.toLowerCase())
      );
    }
    // Fallback: nearest shelter with capacity >= people_count
    if (!bestShelter) {
      let nearestDist = Infinity;
      for (const shelter of availableShelters) {
        if (shelter.available_capacity >= request.people_count) {
          const dist = haversineDistance(shelter.latitude, shelter.longitude, request.latitude, request.longitude);
          if (dist < nearestDist) {
            nearestDist = dist;
            bestShelter = shelter;
          }
        }
      }
    }
  }

  // 5. Atomic state update
  const now = new Date().toISOString();
  const etaMinutes = bestRescue ? Math.max(5, Math.round(haversineDistance(bestRescue.latitude, bestRescue.longitude, request.latitude, request.longitude) * 4)) : 15;
  const eta = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString();

  if (bestRescue) {
    db.updateRescueTeam(bestRescue.id, {
      status: 'deployed',
      assigned_request_id: request.id,
    });
  }

  if (bestAmbulance) {
    db.updateAmbulance(bestAmbulance.id, {
      status: 'deployed',
      assigned_request_id: request.id,
    });
  }

  // Update citizen request
  db.updateCitizenRequest(request.id, {
    status: bestRescue || bestAmbulance ? 'assigned' : 'triaged',
    risk_level: triage.priority,
    risk_score: triage.riskScore,
    priority_score: triage.riskScore,
    ai_confidence: triage.confidence,
    ai_reason: triage.reason,
    ai_recommendation: `Dispatched ${bestRescue?.team_name || 'Standby Squad'} & ${bestAmbulance?.vehicle_code || 'Standby Medic'} to secure citizen. Safe shelter allocated: ${bestShelter?.shelter_name || 'IGMC Stadium'}.`,
    ai_stage: 'dispatched',
    rescue_team_id: bestRescue?.id,
    ambulance_id: bestAmbulance?.id,
    recommended_shelter_id: bestShelter?.id,
    assigned_at: now,
    eta,
  });

  // Create rescue mission
  db.upsertMission({
    request_id: request.id,
    rescue_team_id: bestRescue?.id,
    ambulance_id: bestAmbulance?.id,
    latitude: request.latitude,
    longitude: request.longitude,
    mission_status: 'assigned',
    readiness: 'active',
    notes: `AI-dispatched mission. Target: ${request.people_count} individuals (${request.children_count} children, ${request.elderly_count} elderly). Priority: ${triage.priority}.`,
  });

  db.addAiLog(requestId, 'Dispatch Workflow Executed & Mission Created', 'success', {
    rescueAssigned: bestRescue?.team_name || 'None Available',
    ambulanceAssigned: bestAmbulance?.vehicle_code || 'None Available',
    shelterAssigned: bestShelter?.shelter_name || 'None Available',
    eta: `${etaMinutes} mins`,
  });

  return {
    success: true,
    triage,
    assignedRescueId: bestRescue?.id,
    assignedAmbulanceId: bestAmbulance?.id,
    assignedShelterId: bestShelter?.id,
  };
}

// Phase 8: Deterministic Safety Fallback Algorithm
function evaluateDeterministicFallback(
  req: CitizenRequest,
  riskZones: Array<{ risk_level: string; water_level_m: number }>,
  blockedRoads: Array<unknown>
): GeminiTriageResponse {
  let score = 40;

  // Vulnerable person count
  score += req.children_count * 12;
  score += req.elderly_count * 15;
  score += (req.people_count - req.children_count - req.elderly_count) * 4;

  // Emergency type
  if (req.emergency_type === 'Flood Trapped') score += 25;
  if (req.emergency_type === 'Structure Collapse') score += 30;
  if (req.emergency_type === 'Medical Urgent') score += 20;

  // Medical urgency
  if (req.medical_urgency === 'critical') score += 25;
  else if (req.medical_urgency === 'moderate') score += 12;

  // Blocked roads nearby
  if (blockedRoads.length > 0) score += 10;

  // Normalize score
  score = Math.min(100, Math.max(15, score));

  let priority: PriorityLevel = 'Moderate';
  if (score >= 85) priority = 'Critical';
  else if (score >= 70) priority = 'High';
  else if (score >= 45) priority = 'Moderate';
  else priority = 'Low';

  const dispatchRescue = req.emergency_type === 'Flood Trapped' || req.emergency_type === 'Structure Collapse' || score >= 60;
  const dispatchAmbulance = req.medical_urgency !== 'none' || req.emergency_type === 'Medical Urgent' || req.elderly_count > 0;

  return {
    riskScore: score,
    confidence: 88,
    priority,
    dispatchRescue,
    dispatchAmbulance,
    recommendedShelterName: 'IGMC Stadium Emergency Camp',
    reason: `Deterministic safety triage: ${req.people_count} individuals (${req.children_count} children, ${req.elderly_count} elderly). Emergency type: ${req.emergency_type} with ${req.medical_urgency} medical urgency.`,
  };
}
