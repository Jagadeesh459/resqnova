export type UserRole = 'admin' | 'citizen' | 'rescue' | 'ambulance' | 'shelter' | 'hospital';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  district: string;
  created_at: string;
}

export type EmergencyType =
  | 'Flood Trapped'
  | 'Medical Urgent'
  | 'Structure Collapse'
  | 'Food/Water Cutoff'
  | 'Elderly/Infant Evac';

export type MedicalUrgency = 'none' | 'moderate' | 'critical';

export type PriorityLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type RequestStatus =
  | 'pending'
  | 'triaged'
  | 'assigned'
  | 'en_route'
  | 'on_scene'
  | 'completed'
  | 'cancelled';

export interface CitizenRequest {
  id: string;
  request_id: string;
  citizen_name: string;
  citizen_phone: string;
  latitude: number;
  longitude: number;
  address_hint: string;
  people_count: number;
  children_count: number;
  elderly_count: number;
  emergency_type: EmergencyType;
  medical_urgency: MedicalUrgency;
  photo_url?: string;
  voice_note_url?: string;
  risk_level: PriorityLevel;
  risk_score: number; // 0 - 100
  priority_score: number; // 0 - 100
  ai_confidence: number; // 0 - 100
  ai_reason?: string;
  ai_recommendation?: string;
  ai_stage: 'received' | 'context_loaded' | 'gemini_evaluated' | 'dispatched' | 'completed';
  status: RequestStatus;
  rescue_team_id?: string;
  ambulance_id?: string;
  recommended_shelter_id?: string;
  recommended_hospital_id?: string;
  assigned_at?: string;
  eta?: string;
  completed_at?: string;
  total_duration_minutes?: number;
  created_at: string;

  // Inter-agency rescue and ambulance handoff workflow
  ambulance_requested?: boolean;
  ambulance_requested_reason?: string;
  ambulance_reached?: boolean;
  rescue_done?: boolean;
  rescue_notes?: string;
  ambulance_notes?: string;
}

export interface RescueTeam {
  id: string;
  team_name: string;
  leader: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'deployed' | 'maintenance';
  personnel: number;
  equipment: string;
  deployment_zone: string;
  assigned_request_id?: string;
  updated_at: string;
}

export interface Ambulance {
  id: string;
  vehicle_code: string;
  driver_name: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'deployed' | 'maintenance';
  crew_size: number;
  fuel: number;
  deployment_zone: string;
  assigned_request_id?: string;
  updated_at: string;
}

export interface Shelter {
  id: string;
  shelter_name: string;
  district: string;
  address?: string;
  latitude: number;
  longitude: number;
  capacity: number;
  available_capacity: number;
  occupancy: number;
  food_stock: 'Critical' | 'Low' | 'Adequate' | 'Abundant';
  water_stock: 'Critical' | 'Low' | 'Adequate' | 'Abundant';
  power_backup: boolean;
  contact_number: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  hospital_name: string;
  district: string;
  address?: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  emergency_capacity: number;
  icu_beds: number;
  ambulances_available: number;
  contact_number: string;
  updated_at: string;
}

export interface Road {
  id: string;
  road_name: string;
  district: string;
  status: 'open' | 'flooded' | 'blocked';
  blocked_reason?: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  travel_time: number;
  risk_score: number;
  updated_at: string;
}

export interface RiskZone {
  id: string;
  zone_name: string;
  district: string;
  risk_level: 'High' | 'Severe' | 'Critical';
  risk_score: number;
  water_level_m: number;
  polygon: [number, number][]; // [lat, lng] array
}

export interface RescueMission {
  id: string;
  request_id: string;
  rescue_team_id?: string;
  ambulance_id?: string;
  latitude: number;
  longitude: number;
  mission_status: 'assigned' | 'en_route' | 'on_scene' | 'completed';
  readiness: 'standby' | 'dispatched' | 'active' | 'cleared';
  last_updated: string;
  notes?: string;
}

export interface AIExecutionLog {
  id: string;
  request_id: string;
  step: string;
  status: 'started' | 'success' | 'warning' | 'error';
  details: Record<string, unknown>;
  created_at: string;
}

export interface QuantumResourceAllocation {
  resource_id: string;
  resource_name: string;
  resource_type: 'rescue_boat' | 'ambulance' | 'evac_truck';
  assigned_zone_id: string;
  assigned_zone_name: string;
  travel_distance_km: number;
  risk_mitigation_score: number;
}

export interface QuantumOptimizationResult {
  optimization_id: string;
  timestamp: string;
  method: string;
  backend_engine?: 'qiskit_python' | 'pure_statevector_ts';
  qiskit_version?: string;
  num_qubits: number;
  qubo_matrix_size: string;
  optimal_parameters: {
    gamma: number[];
    beta: number[];
    p_layers: number;
  };
  objective_value: number;
  classical_baseline_value: number;
  gap_or_improvement_pct: number;
  constraints_satisfied: boolean;
  allocations: QuantumResourceAllocation[];
  runtime_ms: number;
  circuit_depth: number;
  statevector_entropy: number;
  pauli_ising_hamiltonian?: string[];
  open_qasm?: string;
}

export interface EvacuationShelterAllocation {
  zone_id: string;
  zone_name: string;
  shelter_id: string;
  shelter_name: string;
  evacuee_count: number;
  vulnerable_count: number;
  assigned_capacity_usage_pct: number;
  safe_route_distance_km: number;
  road_safety_index: number;
}

export interface EvacuationOptimizationResult {
  optimization_id: string;
  timestamp: string;
  method: string;
  backend_engine?: 'qiskit_python' | 'pure_statevector_ts';
  qiskit_version?: string;
  total_evacuees: number;
  shelters_utilized: number;
  capacity_overflow: number; // strictly 0 when valid
  objective_value: number;
  classical_baseline_value: number;
  quantum_gain_pct: number;
  allocations: EvacuationShelterAllocation[];
  runtime_ms: number;
}

export interface FloodImpactZone {
  id: string;
  name: string;
  impact_level: 'Critical - Red Area' | 'Warning - Yellow Area' | 'red' | 'yellow';
  severity_category?: 'red' | 'yellow';
  water_depth_m?: number;
  water_level_m?: number;
  breach_risk_pct?: number;
  citizens_at_risk?: number;
  population_at_risk?: number;
  crest_arrival_eta?: string;
  flow_velocity_mps?: number;
  recommended_action?: string;
  quantum_preposition_needed?: string;
  polygon: [number, number][];
}

export interface QuantumPrepositionPoint {
  id: string;
  type: 'boat' | 'ambulance' | 'shelter' | 'boat_squad' | 'ambulance_als' | 'relief_staging' | 'drone_relay';
  label?: string;
  title?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  qubo_rank?: number;
  qubo_energy_delta?: number;
  dry_ground_elevation_m?: number;
  coverage_sector?: string;
  capacity_info?: string;
  elevation_m?: number;
  staging_reason: string;
}

export interface AiFloodPredictionResult {
  id: string;
  predicted_at?: string;
  timestamp?: string;
  forecast_window_hours?: number;
  predicted_barrage_cusecs?: number;
  predicted_barrage_discharge_cusecs?: number;
  upstream_rainfall_mm_hr?: number;
  soil_moisture_pct?: number;
  flood_crest_eta_hours?: number;
  inundation_velocity_mps?: number;
  flood_probability_percent?: number;
  predicted_peak_time_hours?: number;
  model_name?: string;
  dataset_used?: string;
  accuracy_score?: number;
  red_impact_zones?: FloodImpactZone[];
  yellow_impact_zones?: FloodImpactZone[];
  impact_zones?: FloodImpactZone[];
  quantum_prepositioning?: {
    title: string;
    boats_staged: number;
    ambulances_staged: number;
    staging_points: QuantumPrepositionPoint[];
    optimization_gain_pct: number;
    qubo_energy_state: number;
  };
  quantum_prepositioning_points?: QuantumPrepositionPoint[];
  ai_synthesis_summary?: string;
}

export interface ResQNovaState {
  users: UserProfile[];
  citizen_requests: CitizenRequest[];
  rescue_teams: RescueTeam[];
  ambulances: Ambulance[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: Road[];
  risk_zones: RiskZone[];
  rescue_missions: RescueMission[];
  ai_execution_logs: AIExecutionLog[];
  latest_ai_flood_prediction?: AiFloodPredictionResult;
}
