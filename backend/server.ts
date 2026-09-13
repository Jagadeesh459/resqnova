import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from '../database/db';
import { runAiTriageAndDispatch } from './gemini';
import {
  runAStarRouting,
  runDStarReplanning,
  assignRescueTeamPriorityQueue,
  assignAmbulanceGreenCorridor,
  recommendSafeShelter,
} from './routingEngine';

const serverDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : typeof import.meta?.url === 'string'
    ? path.dirname(fileURLToPath(import.meta.url))
    : process.cwd();

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// ==========================================
// 1. HEALTH & STATE APIS
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'ResQNova Emergency Command Engine',
    district: 'Vijayawada / NTR District, AP',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    osrmConfigured: Boolean(process.env.NEXT_PUBLIC_OSRM_URL),
  });
});

app.get('/api/state', (req, res) => {
  res.json(db.getState());
});

app.post('/api/seed', (req, res) => {
  db.seedInitialData();
  db.broadcast();
  res.json({ success: true, message: 'ResQNova database re-seeded with Vijayawada scenario.' });
});

// ==========================================
// 2. SERVER-SENT EVENTS (SSE) REALTIME STREAM
// ==========================================
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial state immediately
  res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', payload: db.getState() })}\n\n`);

  // Subscribe to subsequent mutations
  const unsubscribe = db.subscribe((state) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'STATE_UPDATE', payload: state })}\n\n`);
    } catch {
      unsubscribe();
    }
  });

  // Keep-alive heartbeat every 15s
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

app.post('/api/seed', (req, res) => {
  db.seedInitialData();
  db.broadcast();
  res.json({ success: true, message: 'Database reset to initial scenario with rich samples' });
});

// ==========================================
// 3. CITIZEN SOS & AI DISPATCH APIS
// ==========================================
app.post('/api/citizen/sos', async (req, res) => {
  try {
    const {
      citizen_name,
      citizen_phone,
      latitude,
      longitude,
      address_hint,
      people_count,
      children_count,
      elderly_count,
      emergency_type,
      medical_urgency,
      photo_url,
      voice_note_url,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'GPS coordinates (latitude, longitude) are required' });
    }

    // 1. Create request record in database
    const newRequest = db.createCitizenRequest({
      citizen_name: citizen_name || 'Anonymous Citizen',
      citizen_phone: citizen_phone || '+91 99999 99999',
      latitude: Number(latitude),
      longitude: Number(longitude),
      address_hint: address_hint || 'Vijayawada Flood Affected Area',
      people_count: Number(people_count) || 1,
      children_count: Number(children_count) || 0,
      elderly_count: Number(elderly_count) || 0,
      emergency_type: emergency_type || 'Flood Trapped',
      medical_urgency: medical_urgency || 'none',
      photo_url,
      voice_note_url,
    });

    // 2. Trigger automated AI Triage & Dispatch workflow
    const dispatchResult = await runAiTriageAndDispatch(newRequest.id);

    res.json({
      success: true,
      request: db.getCitizenRequest(newRequest.id),
      dispatch: dispatchResult,
    });
  } catch (err) {
    console.error('Citizen SOS submission error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/ai/dispatch', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    const result = await runAiTriageAndDispatch(requestId);
    res.json(result);
  } catch (err) {
    console.error('AI dispatch route error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ==========================================
// 4. MISSION & STATUS SYNCHRONIZATION APIS
// ==========================================
app.post('/api/missions/status', (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!requestId || !status) {
      return res.status(400).json({ error: 'requestId and status are required' });
    }

    const result = db.updateMissionStatus(requestId, status);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/missions/request-ambulance', (req, res) => {
  try {
    const { requestId, reason, ambulanceId } = req.body;
    const request = db.getCitizenRequest(requestId);
    if (request) {
      request.ambulance_requested = true;
      request.ambulance_requested_reason = reason;
      request.medical_urgency = 'critical';
      if (ambulanceId) {
        request.ambulance_id = ambulanceId;
        db.updateAmbulance(ambulanceId, { status: 'deployed' });
      }
      db.broadcast();
    }
    res.json({ success: true, requestId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/missions/ambulance-reached', (req, res) => {
  try {
    const { requestId } = req.body;
    const request = db.getCitizenRequest(requestId);
    if (request) {
      request.ambulance_reached = true;
      if (request.status === 'assigned' || request.status === 'en_route') {
        request.status = 'on_scene';
      }
      if (request.rescue_done) {
        request.status = 'completed';
        request.completed_at = new Date().toISOString();
        if (request.rescue_team_id) {
          db.updateRescueTeam(request.rescue_team_id, { status: 'available' });
        }
        if (request.ambulance_id) {
          db.updateAmbulance(request.ambulance_id, { status: 'available' });
        }
      }
      db.broadcast();
    }
    res.json({ success: true, requestId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/missions/rescue-done', (req, res) => {
  try {
    const { requestId, notes } = req.body;
    const request = db.getCitizenRequest(requestId);
    if (request) {
      request.rescue_done = true;
      if (notes) request.rescue_notes = notes;
      if (!request.ambulance_requested || request.ambulance_reached) {
        request.status = 'completed';
        request.completed_at = new Date().toISOString();
        if (request.rescue_team_id) {
          db.updateRescueTeam(request.rescue_team_id, { status: 'available' });
        }
        if (request.ambulance_id) {
          db.updateAmbulance(request.ambulance_id, { status: 'available' });
        }
      } else {
        request.status = 'on_scene';
      }
      db.broadcast();
    }
    res.json({ success: true, requestId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/missions/claim', (req, res) => {
  try {
    const { requestId, teamId } = req.body;
    const request = db.getCitizenRequest(requestId);
    if (request && teamId) {
      request.rescue_team_id = teamId;
      request.status = 'assigned';
      db.updateRescueTeam(teamId, { status: 'deployed' });
      db.broadcast();
    }
    res.json({ success: true, requestId, teamId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/missions/claim-ambulance', (req, res) => {
  try {
    const { requestId, ambulanceId } = req.body;
    const request = db.getCitizenRequest(requestId);
    if (request && ambulanceId) {
      request.ambulance_id = ambulanceId;
      request.ambulance_requested = true;
      if (request.status === 'pending') request.status = 'assigned';
      db.updateAmbulance(ambulanceId, { status: 'deployed' });
      db.broadcast();
    }
    res.json({ success: true, requestId, ambulanceId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/ai/save-flood-prediction', (req, res) => {
  try {
    const { prediction } = req.body;
    if (prediction) {
      const state = db.getState();
      state.latest_ai_flood_prediction = prediction;
      db.broadcast();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/rescue/status', (req, res) => {
  try {
    const { teamId, status, latitude, longitude } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const updated = db.updateRescueTeam(teamId, {
      ...(status && { status }),
      ...(latitude && { latitude: Number(latitude) }),
      ...(longitude && { longitude: Number(longitude) }),
    });
    res.json({ success: true, team: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/ambulance/status', (req, res) => {
  try {
    const { ambulanceId, status, fuel, latitude, longitude } = req.body;
    if (!ambulanceId) return res.status(400).json({ error: 'ambulanceId required' });

    const updated = db.updateAmbulance(ambulanceId, {
      ...(status && { status }),
      ...(fuel !== undefined && { fuel: Number(fuel) }),
      ...(latitude && { latitude: Number(latitude) }),
      ...(longitude && { longitude: Number(longitude) }),
    });
    res.json({ success: true, ambulance: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/shelters/update', (req, res) => {
  try {
    const { shelterId, available_capacity, occupancy, food_stock, water_stock, power_backup } = req.body;
    if (!shelterId) return res.status(400).json({ error: 'shelterId required' });

    const updated = db.updateShelter(shelterId, {
      ...(available_capacity !== undefined && { available_capacity: Number(available_capacity) }),
      ...(occupancy !== undefined && { occupancy: Number(occupancy) }),
      ...(food_stock && { food_stock }),
      ...(water_stock && { water_stock }),
      ...(power_backup !== undefined && { power_backup: Boolean(power_backup) }),
    });
    res.json({ success: true, shelter: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/hospitals/update', (req, res) => {
  try {
    const { hospitalId, available_beds, emergency_capacity, icu_beds, ambulances_available } = req.body;
    if (!hospitalId) return res.status(400).json({ error: 'hospitalId required' });

    const updated = db.updateHospital(hospitalId, {
      ...(available_beds !== undefined && { available_beds: Number(available_beds) }),
      ...(emergency_capacity !== undefined && { emergency_capacity: Number(emergency_capacity) }),
      ...(icu_beds !== undefined && { icu_beds: Number(icu_beds) }),
      ...(ambulances_available !== undefined && { ambulances_available: Number(ambulances_available) }),
    });
    res.json({ success: true, hospital: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/roads/update', (req, res) => {
  try {
    const { roadId, status, blocked_reason } = req.body;
    if (!roadId || !status) return res.status(400).json({ error: 'roadId and status required' });

    const updated = db.updateRoad(roadId, {
      status,
      ...(blocked_reason !== undefined && { blocked_reason }),
    });
    res.json({ success: true, road: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ==========================================
// 5. DYNAMIC ROUTING ENGINE (A* & D* LITE) APIS
// ==========================================
app.post('/api/routing/astar', async (req, res) => {
  try {
    const { start_lat, start_lng, end_lat, end_lng, mode } = req.body;
    if (!start_lat || !start_lng || !end_lat || !end_lng) {
      return res.status(400).json({ error: 'start_lat, start_lng, end_lat, end_lng are required' });
    }

    const route = await runAStarRouting({
      start_lat: Number(start_lat),
      start_lng: Number(start_lng),
      end_lat: Number(end_lat),
      end_lng: Number(end_lng),
      mode,
    });
    res.json(route);
  } catch (err) {
    console.error('A* routing error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/routing/dstar', async (req, res) => {
  try {
    const { mission_id, current_lat, current_lng, goal_lat, goal_lng, blocked_road_ids } = req.body;
    if (!current_lat || !current_lng || !goal_lat || !goal_lng) {
      return res.status(400).json({ error: 'current_lat, current_lng, goal_lat, goal_lng are required' });
    }

    const route = await runDStarReplanning({
      mission_id,
      current_lat: Number(current_lat),
      current_lng: Number(current_lng),
      goal_lat: Number(goal_lat),
      goal_lng: Number(goal_lng),
      blocked_road_ids: Array.isArray(blocked_road_ids) ? blocked_road_ids : [],
    });
    res.json(route);
  } catch (err) {
    console.error('D* Lite replanning error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/routing/rescue', async (req, res) => {
  try {
    const { requestId } = req.body;
    const state = db.getState();
    const request = requestId
      ? db.getCitizenRequest(requestId)
      : state.citizen_requests.find((r) => r.status === 'pending');

    if (!request) {
      return res.status(404).json({ error: 'No active SOS request found' });
    }

    const availableTeams = state.rescue_teams.filter((t) => t.status === 'available');
    const result = await assignRescueTeamPriorityQueue(request, availableTeams);
    if (!result) {
      return res.status(404).json({ error: 'No available rescue teams for dispatch' });
    }

    res.json({
      success: true,
      request_id: request.request_id,
      assigned_team: result.assignedTeam,
      eta_minutes: result.etaMinutes,
      route: result.route,
    });
  } catch (err) {
    console.error('Rescue priority dispatch error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/routing/ambulance', async (req, res) => {
  try {
    const { patient_lat, patient_lng } = req.body;
    const state = db.getState();
    const pLat = patient_lat ? Number(patient_lat) : 16.5038;
    const pLng = patient_lng ? Number(patient_lng) : 80.6432;

    const result = await assignAmbulanceGreenCorridor(pLat, pLng, state.ambulances, state.hospitals);
    if (!result) {
      return res.status(404).json({ error: 'No ambulance or hospital capacity available' });
    }

    res.json({
      success: true,
      ambulance: result.selectedAmbulance,
      hospital: result.selectedHospital,
      pickup_route: result.patientPickupRoute,
      corridor_route: result.hospitalCorridorRoute,
    });
  } catch (err) {
    console.error('Ambulance green corridor error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/routing/shelter', async (req, res) => {
  try {
    const { citizen_lat, citizen_lng } = req.body;
    const state = db.getState();
    const cLat = citizen_lat ? Number(citizen_lat) : 16.5038;
    const cLng = citizen_lng ? Number(citizen_lng) : 80.6432;

    const result = await recommendSafeShelter(cLat, cLng, state.shelters);
    if (!result) {
      return res.status(404).json({ error: 'No relief shelter available' });
    }

    res.json({
      success: true,
      shelter: result.bestShelter,
      score: result.score,
      route: result.route,
    });
  } catch (err) {
    console.error('Shelter routing error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/routing/engine-info', (req, res) => {
  res.json({
    status: 'ready',
    primary_engine: 'Dynamic Graph Routing (A* + D* Lite)',
    target_region: 'Vijayawada / NTR District Urban Flood Mesh',
    algorithms: [
      'A* Admissible Haversine Heuristic (Sub-5ms Initial Corridor)',
      'D* Lite Incremental Dynamic Replanner (Koenig & Likhachev)',
      'Shortest-ETA Priority Queue Rescue Assignment',
      'Emergency 108 Green Corridor Multi-Objective Routing',
      'Capacity & Exposure-Weighted Safe Shelter Allocation',
      'OSRM Real Road Geometry Integration',
    ],
  });
});

// ==========================================
// 6. SAFE ROUTING API (UNIFIED ROAD GEOMETRY)
// ==========================================
app.post('/api/route', async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng, mode } = req.body;
    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ error: 'startLat, startLng, endLat, endLng are required' });
    }

    const astarResult = await runAStarRouting({
      start_lat: Number(startLat),
      start_lng: Number(startLng),
      end_lat: Number(endLat),
      end_lng: Number(endLng),
      mode,
    });

    res.json({
      coordinates: astarResult.coordinates,
      distanceKm: astarResult.distance_km,
      durationMinutes: astarResult.duration_min,
      isSafe: astarResult.is_safe,
      warnings: astarResult.warnings,
      alternativeUsed: astarResult.warnings.length > 0,
      provider: 'Dynamic Graph Routing (A* + OSRM)',
    });
  } catch (err) {
    console.error('Route calculation error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ==========================================
// 7. VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.resolve(serverDir, '../frontend'),
      configFile: path.resolve(serverDir, '../vite.config.ts'),
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ResQNova] Server running on http://localhost:${PORT}`);
  });
}

start();
