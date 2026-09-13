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
import {
  syncRequestToCloud,
  syncRoadStatusToCloud,
  fetchCloudRoads,
  subscribeToRoadChanges,
} from './supabaseSync';

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
    this.initSupabaseRealtime();
  }

  private async initSupabaseRealtime() {
    try {
      const cloudRoads = await fetchCloudRoads();
      if (cloudRoads && cloudRoads.length > 0) {
        for (const cr of cloudRoads) {
          const localIdx = this.roads.findIndex((r) => r.id === cr.id);
          if (localIdx >= 0) {
            this.roads[localIdx].status = cr.status;
            this.roads[localIdx].blocked_reason = cr.blocked_reason;
          } else {
            this.roads.push(cr);
          }
        }
        this.broadcast();
      }

      subscribeToRoadChanges((changedRoad: any) => {
        if (changedRoad && changedRoad.id) {
          const idx = this.roads.findIndex((r) => r.id === changedRoad.id);
          if (idx >= 0) {
            this.roads[idx].status = changedRoad.status;
            this.roads[idx].blocked_reason = changedRoad.blocked_reason;
            this.roads[idx].updated_at = new Date().toISOString();
            this.broadcast();
          }
        }
      });
    } catch (e) {
      console.warn('[DB Supabase Realtime init warning]:', e);
    }
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
        address: 'Loyola Gardens, Vijayawada',
        updated_at: now,
      },
      {
        id: 'shl-5',
        shelter_name: 'PB Siddhartha Arts & Science Auditorium',
        district: 'NTR',
        latitude: 16.5042,
        longitude: 80.6582,
        capacity: 900,
        available_capacity: 560,
        occupancy: 340,
        food_stock: 'Abundant',
        water_stock: 'Abundant',
        power_backup: true,
        contact_number: '+91 866 2475966',
        address: 'Moghalrajpuram, Vijayawada',
        updated_at: now,
      },
      {
        id: 'shl-6',
        shelter_name: 'Tummalapalli Kshetrayya Kalakshetram Hall',
        district: 'NTR',
        latitude: 16.5188,
        longitude: 80.6215,
        capacity: 750,
        available_capacity: 220,
        occupancy: 530,
        food_stock: 'Adequate',
        water_stock: 'Adequate',
        power_backup: true,
        contact_number: '+91 866 2421555',
        address: 'One Town, Vijayawada',
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
        address: 'Hanumanpet, Vijayawada',
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
        address: 'Near Kanaka Durga Varadhi, Tadepalli',
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
        address: 'C.V.R. Complex, Governorpet',
        updated_at: now,
      },
      {
        id: 'hosp-4',
        hospital_name: 'Ayush NRI Multi-Specialty Hospital Benz Circle',
        district: 'NTR',
        latitude: 16.5028,
        longitude: 80.6542,
        total_beds: 280,
        available_beds: 54,
        emergency_capacity: 25,
        icu_beds: 16,
        ambulances_available: 3,
        contact_number: '+91 866 2499999',
        address: 'Near Benz Circle, Ring Road',
        updated_at: now,
      },
      {
        id: 'hosp-5',
        hospital_name: 'Rainbow Children & Emergency Center Labbipet',
        district: 'NTR',
        latitude: 16.5065,
        longitude: 80.6485,
        total_beds: 160,
        available_beds: 42,
        emergency_capacity: 15,
        icu_beds: 10,
        ambulances_available: 2,
        contact_number: '+91 866 6678000',
        address: 'MG Road, Labbipet',
        updated_at: now,
      },
      {
        id: 'hosp-6',
        hospital_name: 'Nagarjuna Hospital Kanuru Trauma Complex',
        district: 'NTR',
        latitude: 16.4975,
        longitude: 80.6845,
        total_beds: 250,
        available_beds: 70,
        emergency_capacity: 22,
        icu_beds: 15,
        ambulances_available: 3,
        contact_number: '+91 866 2583333',
        address: 'Kanuru Main Road, Vijayawada',
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
        status: 'deployed',
        personnel: 8,
        equipment: 'Inflatable Zodiac Boats (2), OBMs, Life Jackets, Satellite Comms',
        deployment_zone: 'Krishna Riverfront / Krishna Lanka',
        assigned_request_id: 'req-vja-001',
        updated_at: now,
      },
      {
        id: 'tm-2',
        team_name: 'SDRF Rapid Water Extraction Unit 2',
        leader: 'Sub-Insp. M. Satyanarayana',
        latitude: 16.5215,
        longitude: 80.6125,
        status: 'deployed',
        personnel: 6,
        equipment: 'FRP Flood Boats, Line Throwers, First Aid Trauma Kit',
        deployment_zone: 'Bhavanipuram / Canal Spillway',
        assigned_request_id: 'req-vja-002',
        updated_at: now,
      },
      {
        id: 'tm-3',
        team_name: 'AP Fire & Disaster Response Squad 4',
        leader: 'Station Officer R. Prasad',
        latitude: 16.5162,
        longitude: 80.6482,
        status: 'deployed',
        personnel: 7,
        equipment: 'High-Axle 4x4 Rescue Truck, Chainsaws, Mud Pumps, Rafts',
        deployment_zone: 'Ramavarappadu / Underpass Zone',
        assigned_request_id: 'req-vja-005',
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
      {
        id: 'tm-5',
        team_name: 'NDRF Inflatable Fleet Bravo',
        leader: 'Insp. Arvind Rawat',
        latitude: 16.5345,
        longitude: 80.6405,
        status: 'deployed',
        personnel: 8,
        equipment: 'Motorized Rafts (2), Searchlights, Evacuation Stretchers',
        deployment_zone: 'Ajit Singh Nagar / Budameru Basin',
        assigned_request_id: 'req-vja-003',
        updated_at: now,
      },
      {
        id: 'tm-6',
        team_name: 'Civil Defense Rapid Boat Squad Gamma',
        leader: 'Sub-Officer G. Mohan',
        latitude: 16.5115,
        longitude: 80.6695,
        status: 'available',
        personnel: 5,
        equipment: 'Aluminum Flood Skiffs, High-Power Megaphones, Lifebuoys',
        deployment_zone: 'Gunadala / Ramavarappadu Reserve',
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
        status: 'deployed',
        crew_size: 2,
        fuel: 92,
        deployment_zone: 'Krishna Lanka Approach / Elevated Bund',
        assigned_request_id: 'req-vja-001',
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
        deployment_zone: 'Benz Circle Staging Sector',
        updated_at: now,
      },
      {
        id: 'amb-3',
        vehicle_code: 'AP-108-BLS-202',
        driver_name: 'D. Naga Raju',
        phone: '+91 98492 10822',
        latitude: 16.5245,
        longitude: 80.6095,
        status: 'deployed',
        crew_size: 2,
        fuel: 95,
        deployment_zone: 'Bhavanipuram Overpass',
        assigned_request_id: 'req-vja-002',
        updated_at: now,
      },
      {
        id: 'amb-4',
        vehicle_code: 'AP-108-ALS-107',
        driver_name: 'K. Rambabu',
        phone: '+91 98492 10807',
        latitude: 16.5325,
        longitude: 80.6385,
        status: 'deployed',
        crew_size: 2,
        fuel: 88,
        deployment_zone: 'BRTS Road Elevated Staging',
        assigned_request_id: 'req-vja-003',
        updated_at: now,
      },
      {
        id: 'amb-5',
        vehicle_code: 'AP-108-BLS-215',
        driver_name: 'P. Sudhakar',
        phone: '+91 98492 10835',
        latitude: 16.5185,
        longitude: 80.6725,
        status: 'deployed',
        crew_size: 2,
        fuel: 90,
        deployment_zone: 'Ramavarappadu Ring Approach',
        assigned_request_id: 'req-vja-005',
        updated_at: now,
      },
      {
        id: 'amb-6',
        vehicle_code: 'AP-108-ALS-112',
        driver_name: 'B. Mahesh',
        phone: '+91 98492 10812',
        latitude: 16.5125,
        longitude: 80.6380,
        status: 'available',
        crew_size: 2,
        fuel: 98,
        deployment_zone: 'GGH Apex Trauma Ramp Standby',
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
      {
        id: 'rd-6',
        road_name: 'Eluru Canal Bund Service Road',
        district: 'NTR',
        status: 'flooded',
        blocked_reason: 'Canal bank erosion; 1.5m waterlogging',
        start_lat: 16.5125,
        start_lng: 80.6415,
        end_lat: 16.5185,
        end_lng: 80.6625,
        travel_time: 18,
        risk_score: 80,
        updated_at: now,
      },
      {
        id: 'rd-7',
        road_name: 'Benz Circle to Skew Bridge Elevated Connector',
        district: 'NTR',
        status: 'open',
        start_lat: 16.5005,
        start_lng: 80.6555,
        end_lat: 16.5085,
        end_lng: 80.6425,
        travel_time: 8,
        risk_score: 12,
        updated_at: now,
      },
      {
        id: 'rd-8',
        road_name: 'Budameru Rivulet Low-Level Causeway',
        district: 'NTR',
        status: 'blocked',
        blocked_reason: 'Budameru flash spillway 2.1m violent surge; completely impassable',
        start_lat: 16.5385,
        start_lng: 80.6385,
        end_lat: 16.5315,
        end_lng: 80.6495,
        travel_time: 35,
        risk_score: 98,
        updated_at: now,
      },
      {
        id: 'rd-9',
        road_name: 'BRTS Road Elevated Bus Corridor',
        district: 'NTR',
        status: 'open',
        start_lat: 16.5285,
        start_lng: 80.6325,
        end_lat: 16.5165,
        end_lng: 80.6515,
        travel_time: 9,
        risk_score: 14,
        updated_at: now,
      },
      {
        id: 'rd-10',
        road_name: 'One Town Brahmin Street Market Lane',
        district: 'NTR',
        status: 'flooded',
        blocked_reason: 'Backwater drainage failure; 1.4m standing water',
        start_lat: 16.5155,
        start_lng: 80.6145,
        end_lat: 16.5195,
        end_lng: 80.6235,
        travel_time: 22,
        risk_score: 82,
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
      {
        id: 'zone-4',
        zone_name: 'Zone D: Ajit Singh Nagar Budameru Breach Area',
        district: 'NTR',
        risk_level: 'Critical',
        risk_score: 94,
        water_level_m: 3.2,
        polygon: [
          [16.5415, 80.6325],
          [16.5445, 80.6515],
          [16.5325, 80.6565],
          [16.5285, 80.6365],
        ],
      },
      {
        id: 'zone-5',
        zone_name: 'Zone E: One Town Canal Influx Corridor',
        district: 'NTR',
        risk_level: 'High',
        risk_score: 80,
        water_level_m: 1.8,
        polygon: [
          [16.5185, 80.6115],
          [16.5225, 80.6255],
          [16.5115, 80.6275],
          [16.5095, 80.6145],
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

    const req2: CitizenRequest = {
      id: 'req-vja-002',
      request_id: 'REQ-VJA-8042',
      citizen_name: 'K. Lakshmi',
      citizen_phone: '+91 94401 55210',
      latitude: 16.5245,
      longitude: 80.6110,
      address_hint: 'Flat 202, Sri Sai Towers, Canal Road, Bhavanipuram (Water 2.8m)',
      people_count: 6,
      children_count: 1,
      elderly_count: 2,
      emergency_type: 'Rooftop Evacuation',
      medical_urgency: 'critical',
      risk_level: 'Critical',
      risk_score: 91,
      priority_score: 93,
      ai_confidence: 92,
      ai_reason:
        'Water overtopping ground floor; elderly cardiac patient requires continuous oxygen support. Canal current severe.',
      ai_recommendation:
        'Deploy SDRF Rapid Water Extraction Unit with line throwers and BLS ambulance standby at Bhavanipuram flyover.',
      ai_stage: 'dispatched',
      status: 'en_route',
      rescue_team_id: 'tm-2',
      ambulance_id: 'amb-3',
      recommended_shelter_id: 'shl-3',
      recommended_hospital_id: 'hosp-2',
      assigned_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      eta: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    };

    const req3: CitizenRequest = {
      id: 'req-vja-003',
      request_id: 'REQ-VJA-8043',
      citizen_name: 'M. Srinivasa Rao',
      citizen_phone: '+91 98492 77114',
      latitude: 16.5365,
      longitude: 80.6425,
      address_hint: 'Near Community Hall, Budameru Rivulet Bank, Ajit Singh Nagar',
      people_count: 4,
      children_count: 1,
      elderly_count: 0,
      emergency_type: 'Medical Emergency',
      medical_urgency: 'critical',
      risk_level: 'Critical',
      risk_score: 95,
      priority_score: 98,
      ai_confidence: 96,
      ai_reason:
        'Budameru flash breach, pregnant mother in acute labor pain, road water 2.2m. Urgent ALS green corridor required.',
      ai_recommendation:
        'Priority 108 ALS corridor direct to GGH Apex Trauma. NDRF boat extraction to dry BRTS flyover ramp.',
      ai_stage: 'dispatched',
      status: 'on_scene',
      rescue_team_id: 'tm-5',
      ambulance_id: 'amb-4',
      recommended_shelter_id: 'shl-4',
      recommended_hospital_id: 'hosp-1',
      assigned_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      eta: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    };

    const req4: CitizenRequest = {
      id: 'req-vja-004',
      request_id: 'REQ-VJA-8044',
      citizen_name: 'G. Venkat & Neighbors',
      citizen_phone: '+91 91770 44228',
      latitude: 16.5165,
      longitude: 80.6185,
      address_hint: 'Near Brahmin Street Panja Centre, One Town Lowlands',
      people_count: 3,
      children_count: 0,
      elderly_count: 1,
      emergency_type: 'Electrical Hazard',
      medical_urgency: 'low',
      risk_level: 'High',
      risk_score: 78,
      priority_score: 80,
      ai_confidence: 89,
      ai_reason:
        'Submerged 11kV transformer pole tilted into floodwaters. 3 adults stranded on store concrete roof.',
      ai_recommendation:
        'APSPDCL grid line de-energized. Marine police boat squad dispatch for safe dry extraction.',
      ai_stage: 'analyzed',
      status: 'pending',
      recommended_shelter_id: 'shl-6',
      recommended_hospital_id: 'hosp-3',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };

    const req5: CitizenRequest = {
      id: 'req-vja-005',
      request_id: 'REQ-VJA-8045',
      citizen_name: 'T. Anji Reddy',
      citizen_phone: '+91 98485 11002',
      latitude: 16.5195,
      longitude: 80.6785,
      address_hint: 'Ramavarappadu Ring Underpass, Vehicle Half Submerged in Flash Inundation',
      people_count: 2,
      children_count: 0,
      elderly_count: 0,
      emergency_type: 'Flash Flood Trapped',
      medical_urgency: 'moderate',
      risk_level: 'High',
      risk_score: 84,
      priority_score: 86,
      ai_confidence: 91,
      ai_reason:
        'Car engine stalled in 3.1m underpass backwater. Occupants on car roof with water level rising.',
      ai_recommendation:
        'Dispatch Fire & Disaster Response Squad 4 with winch, tow cable, and rescue raft.',
      ai_stage: 'dispatched',
      status: 'assigned',
      rescue_team_id: 'tm-3',
      ambulance_id: 'amb-5',
      recommended_shelter_id: 'shl-2',
      recommended_hospital_id: 'hosp-4',
      assigned_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      eta: new Date(Date.now() + 9 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    };

    const req6: CitizenRequest = {
      id: 'req-vja-006',
      request_id: 'REQ-VJA-8046',
      citizen_name: 'B. Sujatha',
      citizen_phone: '+91 99890 33441',
      latitude: 16.5095,
      longitude: 80.6555,
      address_hint: 'Moghalrajpuram 4th Line, Hillside Inundation and Mudflow Risk',
      people_count: 7,
      children_count: 3,
      elderly_count: 2,
      emergency_type: 'Landslide / Mudflow',
      medical_urgency: 'low',
      risk_level: 'Moderate',
      risk_score: 68,
      priority_score: 72,
      ai_confidence: 85,
      ai_reason:
        'Mudflow entering courtyard from hill slopes. Precautionary evacuation requested before nightfall.',
      ai_recommendation:
        'Evacuate family to PB Siddhartha Arts & Science Auditorium or Loyola College Camp.',
      ai_stage: 'analyzed',
      status: 'pending',
      recommended_shelter_id: 'shl-5',
      recommended_hospital_id: 'hosp-1',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    };

    const req7: CitizenRequest = {
      id: 'req-vja-007',
      request_id: 'REQ-VJA-8047',
      citizen_name: 'Md. Farooq',
      citizen_phone: '+91 97000 88219',
      latitude: 16.5415,
      longitude: 80.5985,
      address_hint: 'Gollapudi National Highway Bypass Truck Park',
      people_count: 2,
      children_count: 0,
      elderly_count: 0,
      emergency_type: 'Stranded Commuters',
      medical_urgency: 'low',
      risk_level: 'Moderate',
      risk_score: 62,
      priority_score: 65,
      ai_confidence: 88,
      ai_reason:
        'Two interstate drivers trapped inside truck cabin surrounded by 1.2m water.',
      ai_recommendation:
        'Civil defense boat unit staged nearby for retrieval to Tummalapalli Kalakshetram shelter.',
      ai_stage: 'queued',
      status: 'pending',
      recommended_shelter_id: 'shl-6',
      recommended_hospital_id: 'hosp-3',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    };

    this.citizenRequests = [req1, req2, req3, req4, req5, req6, req7];

    // 9. Assign initial resources
    this.rescueTeams[0].status = 'deployed';
    this.rescueTeams[0].assigned_request_id = req1.id;
    this.ambulances[0].status = 'deployed';
    this.ambulances[0].assigned_request_id = req1.id;

    // 10. Initial Rescue Missions
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
      {
        id: 'msn-002',
        request_id: req2.id,
        rescue_team_id: 'tm-2',
        ambulance_id: 'amb-3',
        latitude: req2.latitude,
        longitude: req2.longitude,
        mission_status: 'en_route',
        readiness: 'active',
        last_updated: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        notes: 'SDRF boat navigating Bhavanipuram canal spillway for rooftop casualty retrieval.',
      },
      {
        id: 'msn-003',
        request_id: req3.id,
        rescue_team_id: 'tm-5',
        ambulance_id: 'amb-4',
        latitude: req3.latitude,
        longitude: req3.longitude,
        mission_status: 'on_scene',
        readiness: 'active',
        last_updated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        notes: 'NDRF Bravo extracted pregnant mother to BRTS ramp; ALS Unit 107 administering initial triage.',
      },
      {
        id: 'msn-004',
        request_id: req5.id,
        rescue_team_id: 'tm-3',
        ambulance_id: 'amb-5',
        latitude: req5.latitude,
        longitude: req5.longitude,
        mission_status: 'assigned',
        readiness: 'active',
        last_updated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        notes: 'Fire Squad 4 dispatched with winch to pull submerged vehicle occupants at Ramavarappadu.',
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
      {
        id: 'log-005',
        request_id: req3.id,
        step: 'Critical Medical Surge Dispatch',
        status: 'success',
        details: {
          condition: 'Pregnancy Labor in Flooded Sector',
          rescueTeam: 'NDRF Inflatable Fleet Bravo',
          ambulance: 'AP-108-ALS-107',
          hospital: 'GGH Apex Trauma Center',
        },
        created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
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
    if (updates.status) {
      syncRoadStatusToCloud(id, updates.status, updates.blocked_reason);
    }
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
