import {
  CitizenRequest,
  RescueTeam,
  Ambulance,
  Shelter,
  Hospital,
  Road,
  RiskZone,
  RescueMission,
  AIExecutionLog,
  UserProfile,
  ResQNovaState,
} from '../src/types';
import { syncRequestToCloud } from './supabaseSync';

class ResQNovaDatabase {
  private users: UserProfile[] = [];
  private citizenRequests: CitizenRequest[] = [];
  private rescueTeams: RescueTeam[] = [];
  private ambulances: Ambulance[] = [];
  private shelters: Shelter[] = [];
  private hospitals: Hospital[] = [];
  private roads: Road[] = [];
  private riskZones: RiskZone[] = [];
  private rescueMissions: RescueMission[] = [];
  private aiExecutionLogs: AIExecutionLog[] = [];

  // Listeners for real-time broadcast
  private listeners: Set<(state: ResQNovaState) => void> = new Set();

  constructor() {
    this.seedInitialData();
  }

  public subscribe(callback: (state: ResQNovaState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public broadcast(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Realtime broadcast error:', err);
      }
    }
  }

  public getState(): ResQNovaState {
    return {
      users: [...this.users],
      citizen_requests: [...this.citizenRequests],
      rescue_teams: [...this.rescueTeams],
      ambulances: [...this.ambulances],
      shelters: [...this.shelters],
      hospitals: [...this.hospitals],
      roads: [...this.roads],
      risk_zones: [...this.riskZones],
      rescue_missions: [...this.rescueMissions],
      ai_execution_logs: [...this.aiExecutionLogs],
    };
  }

  public seedInitialData(): void {
    const now = new Date().toISOString();

    // 1. Users
    this.users = [
      {
        id: 'usr-admin-1',
        email: 'admin@resqnova.gov.in',
        full_name: 'Dr. K. Swaminathan (Collector & DM)',
        role: 'admin',
        district: 'NTR District, Vijayawada',
        created_at: now,
      },
      {
        id: 'usr-citizen-1',
        email: 'ramesh.p@gmail.com',
        full_name: 'P. Ramesh',
        phone: '+91 98480 23114',
        role: 'citizen',
        district: 'NTR District, Vijayawada',
        created_at: now,
      },
      {
        id: 'usr-rescue-1',
        email: 'ndrf.alpha@resqnova.gov.in',
        full_name: 'Inspector Vikram Singh (NDRF Boat Squad Alpha)',
        phone: '+91 94401 88722',
        role: 'rescue',
        district: 'NTR District, Vijayawada',
        created_at: now,
      },
      {
        id: 'usr-ambulance-1',
        email: 'medic.108@resqnova.gov.in',
        full_name: 'S. Koteswara Rao (108 ALS Unit 101)',
        phone: '+91 98492 10801',
        role: 'ambulance',
        district: 'NTR District, Vijayawada',
        created_at: now,
      },
      {
        id: 'usr-shelter-1',
        email: 'igmc.shelter@resqnova.gov.in',
        full_name: 'M. Anitha (IGMC Stadium Relief Officer)',
        phone: '+91 866 2471001',
        role: 'shelter',
        district: 'NTR District, Vijayawada',
        created_at: now,
      },
      {
        id: 'usr-hospital-1',
        email: 'ggh.er@resqnova.gov.in',
        full_name: 'Dr. V. Prasad (GGH Superintendent)',
        phone: '+91 866 2575555',
        role: 'hospital',
        district: 'NTR District, Vijayawada',
        created_at: now,
      },
    ];

    // 2. Shelters
    this.shelters = [
      {
        id: 'shl-1',
        shelter_name: 'IGMC Stadium Emergency Camp',
        district: 'NTR',
        latitude: 16.5055,
        longitude: 80.6508,
        capacity: 1200,
        available_capacity: 680,
        occupancy: 520,
        food_stock: 'Adequate',
        water_stock: 'Adequate',
        power_backup: true,
        contact_number: '+91 866 2471001',
        updated_at: now,
      },
      {
        id: 'shl-2',
        shelter_name: 'Siddhartha Medical College Complex',
        district: 'NTR',
        latitude: 16.5012,
        longitude: 80.6725,
        capacity: 800,
        available_capacity: 420,
        occupancy: 380,
        food_stock: 'Abundant',
        water_stock: 'Adequate',
        power_backup: true,
        contact_number: '+91 866 2473456',
        updated_at: now,
      },
      {
        id: 'shl-3',
        shelter_name: 'Bishop Azaraiah Girls High School Relief Hub',
        district: 'NTR',
        latitude: 16.5165,
        longitude: 80.6272,
        capacity: 650,
        available_capacity: 310,
        occupancy: 340,
        food_stock: 'Adequate',
        water_stock: 'Low',
        power_backup: true,
        contact_number: '+91 866 2420999',
        updated_at: now,
      },
      {
        id: 'shl-4',
        shelter_name: 'Andhra Loyola College Gymnasium Shelter',
        district: 'NTR',
        latitude: 16.5078,
        longitude: 80.6621,
        capacity: 1000,
        available_capacity: 750,
        occupancy: 250,
        food_stock: 'Abundant',
        water_stock: 'Abundant',
        power_backup: true,
        contact_number: '+91 866 2476082',
        updated_at: now,
      },
    ];

    // 3. Hospitals
    this.hospitals = [
      {
        id: 'hosp-1',
        hospital_name: 'Government General Hospital (GGH) Vijayawada',
        district: 'NTR',
        latitude: 16.5122,
        longitude: 80.6385,
        total_beds: 450,
        available_beds: 85,
        emergency_capacity: 40,
        icu_beds: 24,
        ambulances_available: 4,
        contact_number: '+91 866 2575555',
        updated_at: now,
      },
      {
        id: 'hosp-2',
        hospital_name: 'Manipal Hospital Tadepalli Trauma Center',
        district: 'NTR / Guntur Border',
        latitude: 16.4835,
        longitude: 80.6152,
        total_beds: 300,
        available_beds: 62,
        emergency_capacity: 30,
        icu_beds: 18,
        ambulances_available: 3,
        contact_number: '+91 866 6499999',
        updated_at: now,
      },
      {
        id: 'hosp-3',
        hospital_name: 'Andhra Hospitals Emergency Wing Governorpet',
        district: 'NTR',
        latitude: 16.5145,
        longitude: 80.6322,
        total_beds: 220,
        available_beds: 45,
        emergency_capacity: 20,
        icu_beds: 12,
        ambulances_available: 2,
        contact_number: '+91 866 2438888',
        updated_at: now,
      },
    ];

    // 4. Rescue Teams
    this.rescueTeams = [
      {
        id: 'tm-1',
        team_name: 'NDRF Boat Squad Alpha',
        leader: 'Insp. Vikram Singh',
        latitude: 16.5028,
        longitude: 80.6355,
        status: 'available',
        personnel: 8,
        equipment: 'Inflatable Zodiac Boats (2), OBMs, Life Jackets, Satellite Comms',
        deployment_zone: 'Krishna Riverfront / Krishna Lanka',
        updated_at: now,
      },
      {
        id: 'tm-2',
        team_name: 'SDRF Rapid Water Extraction Unit 2',
        leader: 'Sub-Insp. M. Satyanarayana',
        latitude: 16.5215,
        longitude: 80.6125,
        status: 'available',
        personnel: 6,
        equipment: 'FRP Flood Boats, Line Throwers, First Aid Trauma Kit',
        deployment_zone: 'Bhavanipuram / Gollapudi',
        updated_at: now,
      },
      {
        id: 'tm-3',
        team_name: 'AP Fire & Disaster Response Squad 4',
        leader: 'Station Officer R. Prasad',
        latitude: 16.5162,
        longitude: 80.6482,
        status: 'available',
        personnel: 7,
        equipment: 'High-Axle 4x4 Rescue Truck, Chainsaws, Mud Pumps',
        deployment_zone: 'Governorpet / Moghalrajpuram',
        updated_at: now,
      },
      {
        id: 'tm-4',
        team_name: 'Marine Police Coastal Rescue 1',
        leader: 'SI K. Srinivasa Rao',
        latitude: 16.4952,
        longitude: 80.6225,
        status: 'available',
        personnel: 6,
        equipment: 'Rigid Inflatable Hull Boat, Diving Gear, Thermal Scanners',
        deployment_zone: 'Prakasam Barrage Downstream',
        updated_at: now,
      },
    ];

    // 5. Ambulances
    this.ambulances = [
      {
        id: 'amb-1',
        vehicle_code: 'AP-108-ALS-101',
        driver_name: 'S. Koteswara Rao',
        phone: '+91 98492 10801',
        latitude: 16.5085,
        longitude: 80.6412,
        status: 'available',
        crew_size: 2,
        fuel: 92,
        deployment_zone: 'Kanaka Durga Varadhi South Approach',
        updated_at: now,
      },
      {
        id: 'amb-2',
        vehicle_code: 'AP-108-ALS-104',
        driver_name: 'G. Venkatesh',
        phone: '+91 98492 10804',
        latitude: 16.5015,
        longitude: 80.6585,
        status: 'available',
        crew_size: 2,
        fuel: 85,
        deployment_zone: 'Benz Circle Sector',
        updated_at: now,
      },
      {
        id: 'amb-3',
        vehicle_code: 'AP-108-BLS-202',
        driver_name: 'D. Naga Raju',
        phone: '+91 98492 10822',
        latitude: 16.5245,
        longitude: 80.6095,
        status: 'available',
        crew_size: 2,
        fuel: 95,
        deployment_zone: 'Bhavanipuram Overpass',
        updated_at: now,
      },
    ];

    // 6. Roads
    this.roads = [
      {
        id: 'rd-1',
        road_name: 'Prakasam Barrage Direct Access Road',
        district: 'NTR',
        status: 'blocked',
        blocked_reason: 'Krishna River overtopping with 2.8m violent flood current',
        start_lat: 16.5075,
        start_lng: 80.6185,
        end_lat: 16.4982,
        end_lng: 80.6122,
        travel_time: 25,
        risk_score: 96,
        updated_at: now,
      },
      {
        id: 'rd-2',
        road_name: 'Krishna Lanka River Bund Road',
        district: 'NTR',
        status: 'flooded',
        blocked_reason: 'Breach in bund sector 3; 1.8m stagnant water',
        start_lat: 16.4995,
        start_lng: 80.6355,
        end_lat: 16.4925,
        end_lng: 80.6485,
        travel_time: 30,
        risk_score: 92,
        updated_at: now,
      },
      {
        id: 'rd-3',
        road_name: 'MG Road (Mahatma Gandhi Road) Main Artery',
        district: 'NTR',
        status: 'open',
        start_lat: 16.5135,
        start_lng: 80.6312,
        end_lat: 16.5015,
        end_lng: 80.6585,
        travel_time: 11,
        risk_score: 15,
        updated_at: now,
      },
      {
        id: 'rd-4',
        road_name: 'NH-16 Kanaka Durga Flyover / Elevated Highway',
        district: 'NTR',
        status: 'open',
        start_lat: 16.5215,
        start_lng: 80.6125,
        end_lat: 16.5085,
        end_lng: 80.6395,
        travel_time: 7,
        risk_score: 10,
        updated_at: now,
      },
      {
        id: 'rd-5',
        road_name: 'Bhavanipuram Canal Side Road',
        district: 'NTR',
        status: 'flooded',
        blocked_reason: 'Canal overflow submerged road up to 1.2m depth',
        start_lat: 16.5185,
        start_lng: 80.6055,
        end_lat: 16.5255,
        end_lng: 80.6195,
        travel_time: 20,
        risk_score: 84,
        updated_at: now,
      },
    ];

    // 7. Risk Zones
    this.riskZones = [
      {
        id: 'zone-1',
        zone_name: 'Zone A: Krishna Lanka Riverfront Sector',
        district: 'NTR',
        risk_level: 'Critical',
        risk_score: 95,
        water_level_m: 3.8,
        polygon: [
          [16.5045, 80.6285],
          [16.5015, 80.6425],
          [16.4912, 80.6465],
          [16.4885, 80.6325],
          [16.4985, 80.6245],
        ],
      },
      {
        id: 'zone-2',
        zone_name: 'Zone B: Bhavanipuram Lowland Spillway',
        district: 'NTR',
        risk_level: 'High',
        risk_score: 82,
        water_level_m: 2.3,
        polygon: [
          [16.5295, 80.6015],
          [16.5325, 80.6185],
          [16.5195, 80.6225],
          [16.5145, 80.6055],
        ],
      },
      {
        id: 'zone-3',
        zone_name: 'Zone C: Ramavarappadu Inundation Pocket',
        district: 'NTR',
        risk_level: 'High',
        risk_score: 76,
        water_level_m: 1.9,
        polygon: [
          [16.5225, 80.6715],
          [16.5295, 80.6865],
          [16.5165, 80.6912],
          [16.5085, 80.6755],
        ],
      },
    ];

    // 8. Seed Sample Citizen SOS Requests
    const initialSosTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const req1: CitizenRequest = {
      id: 'req-vja-001',
      request_id: 'REQ-VJA-8041',
      citizen_name: 'P. Ramesh',
      citizen_phone: '+91 98480 23114',
      latitude: 16.4982,
      longitude: 80.6385,
      address_hint: 'House #4-12, Behind Bund Police Outpost, Krishna Lanka',
      people_count: 5,
      children_count: 2,
      elderly_count: 1,
      emergency_type: 'Flood Trapped',
      medical_urgency: 'moderate',
      risk_level: 'Critical',
      risk_score: 94,
      priority_score: 96,
      ai_confidence: 94,
      ai_reason:
        'Water level reached 1st floor balcony. 2 infants and 1 asthmatic elder trapped. Nearest road blocked by 1.8m current.',
      ai_recommendation:
        'Dispatch NDRF inflatable boat squad with ALS ambulance standby at high-elevation Bund access point.',
      ai_stage: 'dispatched',
      status: 'assigned',
      rescue_team_id: 'tm-1',
      ambulance_id: 'amb-1',
      recommended_shelter_id: 'shl-1',
      recommended_hospital_id: 'hosp-1',
      assigned_at: initialSosTime,
      eta: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
      created_at: initialSosTime,
    };

    this.citizenRequests = [req1];

    // 9. Assign initial resources
    this.rescueTeams[0].status = 'deployed';
    this.rescueTeams[0].assigned_request_id = req1.id;
    this.ambulances[0].status = 'deployed';
    this.ambulances[0].assigned_request_id = req1.id;

    // 10. Initial Rescue Mission
    this.rescueMissions = [
      {
        id: 'msn-001',
        request_id: req1.id,
        rescue_team_id: 'tm-1',
        ambulance_id: 'amb-1',
        latitude: req1.latitude,
        longitude: req1.longitude,
        mission_status: 'assigned',
        readiness: 'active',
        last_updated: initialSosTime,
        notes: 'Priority evacuation of elderly patient and 2 infants from Krishna Lanka sector.',
      },
    ];

    // 11. Initial AI Execution Logs
    this.aiExecutionLogs = [
      {
        id: 'log-001',
        request_id: req1.id,
        step: 'SOS Received',
        status: 'success',
        details: {
          requestId: req1.request_id,
          coords: [req1.latitude, req1.longitude],
          people: 5,
        },
        created_at: initialSosTime,
      },
      {
        id: 'log-002',
        request_id: req1.id,
        step: 'Context & GIS Layers Loaded',
        status: 'success',
        details: {
          activeZone: 'Zone A: Krishna Lanka Riverfront Sector',
          waterLevel: '3.8m',
          blockedRoads: 2,
        },
        created_at: initialSosTime,
      },
      {
        id: 'log-003',
        request_id: req1.id,
        step: 'Gemini AI Triage Evaluated',
        status: 'success',
        details: {
          model: 'gemini-3.8-flash',
          priority: 'Critical',
          riskScore: 94,
          dispatchRescue: true,
          dispatchAmbulance: true,
        },
        created_at: initialSosTime,
      },
      {
        id: 'log-004',
        request_id: req1.id,
        step: 'Resource Dispatch Assigned',
        status: 'success',
        details: {
          rescueTeam: 'NDRF Boat Squad Alpha',
          ambulance: 'AP-108-ALS-101',
          shelter: 'IGMC Stadium Emergency Camp',
        },
        created_at: initialSosTime,
      },
    ];
  }

  // API Methods
  public createCitizenRequest(
    data: Omit<
      CitizenRequest,
      | 'id'
      | 'request_id'
      | 'risk_score'
      | 'priority_score'
      | 'ai_confidence'
      | 'ai_stage'
      | 'status'
      | 'created_at'
      | 'risk_level'
    >
  ): CitizenRequest {
    const id = `req-${Date.now()}`;
    const code = `REQ-VJA-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newRequest: CitizenRequest = {
      ...data,
      id,
      request_id: code,
      risk_level: 'Moderate',
      risk_score: 50,
      priority_score: 50,
      ai_confidence: 0,
      ai_stage: 'received',
      status: 'pending',
      created_at: now,
    };

    this.citizenRequests.unshift(newRequest);

    this.addAiLog(id, 'SOS Received', 'success', {
      requestId: code,
      coords: [newRequest.latitude, newRequest.longitude],
      peopleCount: newRequest.people_count,
      emergencyType: newRequest.emergency_type,
    });

    // Asynchronously synchronize with Supabase Cloud
    syncRequestToCloud(newRequest).catch((e) => console.warn('[Supabase Sync error]', e));

    this.broadcast();
    return newRequest;
  }

  public updateCitizenRequest(id: string, updates: Partial<CitizenRequest>): CitizenRequest | null {
    const idx = this.citizenRequests.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    this.citizenRequests[idx] = {
      ...this.citizenRequests[idx],
      ...updates,
    };

    this.broadcast();
    return this.citizenRequests[idx];
  }

  public getCitizenRequest(id: string): CitizenRequest | undefined {
    return this.citizenRequests.find((r) => r.id === id || r.request_id === id);
  }

  public updateRescueTeam(id: string, updates: Partial<RescueTeam>): RescueTeam | null {
    const idx = this.rescueTeams.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.rescueTeams[idx] = {
      ...this.rescueTeams[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.broadcast();
    return this.rescueTeams[idx];
  }

  public updateAmbulance(id: string, updates: Partial<Ambulance>): Ambulance | null {
    const idx = this.ambulances.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.ambulances[idx] = {
      ...this.ambulances[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.broadcast();
    return this.ambulances[idx];
  }

  public updateShelter(id: string, updates: Partial<Shelter>): Shelter | null {
    const idx = this.shelters.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.shelters[idx] = {
      ...this.shelters[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.broadcast();
    return this.shelters[idx];
  }

  public updateHospital(id: string, updates: Partial<Hospital>): Hospital | null {
    const idx = this.hospitals.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.hospitals[idx] = {
      ...this.hospitals[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.broadcast();
    return this.hospitals[idx];
  }

  public updateRoad(id: string, updates: Partial<Road>): Road | null {
    const idx = this.roads.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.roads[idx] = {
      ...this.roads[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.broadcast();
    return this.roads[idx];
  }

  public upsertMission(mission: Partial<RescueMission> & { request_id: string }): RescueMission {
    const idx = this.rescueMissions.findIndex((m) => m.request_id === mission.request_id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      this.rescueMissions[idx] = {
        ...this.rescueMissions[idx],
        ...mission,
        last_updated: now,
      };
      this.broadcast();
      return this.rescueMissions[idx];
    } else {
      const newMission: RescueMission = {
        id: `msn-${Date.now()}`,
        request_id: mission.request_id,
        rescue_team_id: mission.rescue_team_id,
        ambulance_id: mission.ambulance_id,
        latitude: mission.latitude || 16.5062,
        longitude: mission.longitude || 80.648,
        mission_status: mission.mission_status || 'assigned',
        readiness: mission.readiness || 'active',
        last_updated: now,
        notes: mission.notes || '',
      };
      this.rescueMissions.unshift(newMission);
      this.broadcast();
      return newMission;
    }
  }

  public updateMissionStatus(
    requestId: string,
    status: 'assigned' | 'en_route' | 'on_scene' | 'completed'
  ): { mission: RescueMission | null; request: CitizenRequest | null } {
    const mission = this.rescueMissions.find((m) => m.request_id === requestId);
    const request = this.citizenRequests.find((r) => r.id === requestId);
    const now = new Date().toISOString();

    if (mission) {
      mission.mission_status = status;
      mission.last_updated = now;
      if (status === 'completed') {
        mission.readiness = 'cleared';
      }
    }

    if (request) {
      request.status = status;
      if (status === 'completed') {
        request.completed_at = now;
        const start = new Date(request.created_at).getTime();
        const end = new Date(now).getTime();
        request.total_duration_minutes = Math.max(1, Math.round((end - start) / (1000 * 60)));

        // Free up assigned resources
        if (request.rescue_team_id) {
          const team = this.rescueTeams.find((t) => t.id === request.rescue_team_id);
          if (team) {
            team.status = 'available';
            team.assigned_request_id = undefined;
          }
        }
        if (request.ambulance_id) {
          const amb = this.ambulances.find((a) => a.id === request.ambulance_id);
          if (amb) {
            amb.status = 'available';
            amb.assigned_request_id = undefined;
          }
        }
      }
    }

    this.addAiLog(requestId, `Mission Status Changed: ${status.toUpperCase()}`, 'success', {
      requestId,
      status,
      timestamp: now,
    });

    this.broadcast();
    return { mission: mission || null, request: request || null };
  }

  public addAiLog(
    requestId: string,
    step: string,
    status: 'started' | 'success' | 'warning' | 'error',
    details: Record<string, unknown>
  ): AIExecutionLog {
    const log: AIExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      request_id: requestId,
      step,
      status,
      details,
      created_at: new Date().toISOString(),
    };
    this.aiExecutionLogs.unshift(log);
    // Keep max 200 logs
    if (this.aiExecutionLogs.length > 200) {
      this.aiExecutionLogs.pop();
    }
    return log;
  }
}

export const db = new ResQNovaDatabase();
