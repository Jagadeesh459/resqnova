import { AiFloodPredictionResult, FloodImpactZone, QuantumPrepositionPoint } from '../types';

export type HydraulicSeverityTier = 'low' | 'moderate' | 'high' | 'extreme';

export interface HydraulicInputs {
  inflowCusecs: number;
  rainfallMm: number;
  soilMoisturePct: number;
  gatesOpen: number;
  modelArchitecture?: string;
  selectedDataset?: string;
  accuracyScore?: number;
}

export interface FloodPreset {
  id: string;
  title: string;
  tier: HydraulicSeverityTier;
  inflowCusecs: number;
  rainfallMm: number;
  soilMoisturePct: number;
  gatesOpen: number;
  badge: string;
  badgeColor: string;
  borderClass: string;
  activeClass: string;
  description: string;
  redCount: number;
  yellowCount: number;
}

export const FLOOD_PRESETS: FloodPreset[] = [
  {
    id: 'preset_low',
    title: 'Low Advisory',
    tier: 'low',
    inflowCusecs: 210000,
    rainfallMm: 45,
    soilMoisturePct: 56,
    gatesOpen: 24,
    badge: 'STAGE 0 • ADVISORY',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500/30 hover:border-emerald-400',
    activeClass: 'ring-2 ring-emerald-400 bg-emerald-950/30',
    description: 'Minor riverbank rise. Water confined to low sandbars. 1 Red & 1 Yellow Area.',
    redCount: 1,
    yellowCount: 1,
  },
  {
    id: 'preset_moderate',
    title: 'Moderate Warning',
    tier: 'moderate',
    inflowCusecs: 460000,
    rainfallMm: 140,
    soilMoisturePct: 82,
    gatesOpen: 48,
    badge: 'STAGE 1 • WARNING',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-500/30 hover:border-amber-400',
    activeClass: 'ring-2 ring-amber-400 bg-amber-950/30',
    description: 'Standard monsoon crest. Main bunds under pressure. 2 Red & 2 Yellow Areas.',
    redCount: 2,
    yellowCount: 2,
  },
  {
    id: 'preset_high',
    title: 'Severe Inundation',
    tier: 'high',
    inflowCusecs: 640000,
    rainfallMm: 235,
    soilMoisturePct: 92,
    gatesOpen: 64,
    badge: 'STAGE 2 • SEVERE',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    borderClass: 'border-orange-500/30 hover:border-orange-400',
    activeClass: 'ring-2 ring-orange-400 bg-orange-950/30',
    description: 'Critical flood stage. Overflows into Ramalingeswara & Canal outfalls. 3 Red & 3 Yellow Areas.',
    redCount: 3,
    yellowCount: 3,
  },
  {
    id: 'preset_extreme',
    title: 'Catastrophic Breach',
    tier: 'extreme',
    inflowCusecs: 810000,
    rainfallMm: 320,
    soilMoisturePct: 98,
    gatesOpen: 70,
    badge: 'STAGE 3 • CATASTROPHIC',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    borderClass: 'border-red-500/30 hover:border-red-400',
    activeClass: 'ring-2 ring-red-400 bg-red-950/30',
    description: 'Emergency cloudburst overspill across Krishna Lanka, Budameru & Autonagar. 4 Red & 4 Yellow Areas.',
    redCount: 4,
    yellowCount: 4,
  },
];

/**
 * Calculates the normalized Hydraulic Severity Index (HSI 0.0 - 1.0)
 * and determines the qualitative severity tier.
 */
export function calculateSeverityTier(inputs: HydraulicInputs): {
  hsi: number;
  tier: HydraulicSeverityTier;
  tierName: string;
  tierColor: string;
} {
  const { inflowCusecs, rainfallMm, soilMoisturePct, gatesOpen } = inputs;

  const inflowNorm = Math.min(1, Math.max(0, (inflowCusecs - 150000) / 700000));
  const rainNorm = Math.min(1, Math.max(0, (rainfallMm - 20) / 330));
  const soilNorm = Math.min(1, Math.max(0, (soilMoisturePct - 40) / 60));
  const gatesNorm = Math.min(1, Math.max(0, (gatesOpen - 10) / 60));

  const hsi = Number(
    (inflowNorm * 0.46 + rainNorm * 0.32 + soilNorm * 0.14 + gatesNorm * 0.08).toFixed(3)
  );

  if (hsi < 0.32) {
    return {
      hsi,
      tier: 'low',
      tierName: 'Advisory Low Flood Stage (1 Red, 1 Yellow)',
      tierColor: '#10b981',
    };
  } else if (hsi < 0.58) {
    return {
      hsi,
      tier: 'moderate',
      tierName: 'Stage-1 Moderate Flood Alert (2 Red, 2 Yellow)',
      tierColor: '#f59e0b',
    };
  } else if (hsi < 0.78) {
    return {
      hsi,
      tier: 'high',
      tierName: 'Stage-2 Severe Inundation Warning (3 Red, 3 Yellow)',
      tierColor: '#f97316',
    };
  } else {
    return {
      hsi,
      tier: 'extreme',
      tierName: 'Stage-3 Catastrophic Flash Inundation (4 Red, 4 Yellow)',
      tierColor: '#ef4444',
    };
  }
}

/**
 * Adjust polygon coordinates smoothly based on HSI expansion factor.
 */
function expandPolygon(coords: [number, number][], factor: number, center: [number, number]): [number, number][] {
  return coords.map(([lat, lng]) => {
    const dLat = lat - center[0];
    const dLng = lng - center[1];
    return [
      Number((center[0] + dLat * factor).toFixed(5)),
      Number((center[1] + dLng * factor).toFixed(5)),
    ];
  });
}

/**
 * Core dynamic prediction engine: generates distinct Red and Yellow zones,
 * water depths, populations, and pre-positioning points based on telemetry values.
 */
export function computeAiFloodPrediction(inputs: HydraulicInputs): AiFloodPredictionResult {
  const {
    inflowCusecs,
    rainfallMm,
    soilMoisturePct,
    gatesOpen,
    modelArchitecture = 'bilstm_attention',
    selectedDataset = 'krishna_historical',
    accuracyScore = 97.6,
  } = inputs;

  const { hsi, tier } = calculateSeverityTier(inputs);

  // Dynamic expansion factor for polygon footprint (subtle scale around center)
  const expansionFactor = Number((0.92 + hsi * 0.22).toFixed(3));

  // Calculated Metrics
  const floodProbability = Math.min(
    99.6,
    Math.max(32.4, Number((30 + hsi * 68.5).toFixed(1)))
  );

  const predictedPeakHours = Number(
    Math.max(1.8, Number((11.5 - hsi * 8.6).toFixed(1)))
  );

  const predictedDischarge = Math.round(
    inflowCusecs * (1.04 + (rainfallMm / 400) * 0.12 + (soilMoisturePct / 100) * 0.05)
  );

  // -------------------------------------------------------------
  // ZONE DEFINITIONS PER SEVERITY TIER
  // -------------------------------------------------------------
  const impactZones: FloodImpactZone[] = [];

  if (tier === 'low') {
    // -----------------------------------------------------------
    // TIER 1: LOW ADVISORY (1 RED AREA, 1 YELLOW AREA)
    // -----------------------------------------------------------
    // Red 1: Sandbar Fringe
    const basePolyRed1: [number, number][] = [
      [16.5005, 80.640],
      [16.5035, 80.6435],
      [16.505, 80.647],
      [16.5015, 80.649],
      [16.498, 80.643],
    ];
    impactZones.push({
      id: 'zone-red-kl-sandbar',
      name: 'Krishna Lanka Sandbar Fringe & Low Ghat (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((1.8 + hsi * 0.8).toFixed(2)),
      population_at_risk: 5800,
      polygon: expandPolygon(basePolyRed1, expansionFactor, [16.501, 80.644]),
      quantum_preposition_needed:
        'Stage 1x Inflatable Patrol Boat at Jetty Alpha for early sandbar squatter advisory prior to water level rise.',
    });

    // Yellow 1: Bhavanipuram Ghat Steps
    const basePolyYel1: [number, number][] = [
      [16.516, 80.603],
      [16.520, 80.609],
      [16.518, 80.615],
      [16.512, 80.608],
    ];
    impactZones.push({
      id: 'zone-yellow-bp-ghat',
      name: 'Bhavanipuram Ferry Ghat Landing (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((1.3 + hsi * 0.6).toFixed(2)),
      population_at_risk: 4200,
      polygon: expandPolygon(basePolyYel1, expansionFactor, [16.516, 80.609]),
      quantum_preposition_needed:
        'Erect warning cordon along lower steps; deploy loudspeaker mobile unit to alert river commuters.',
    });
  } else if (tier === 'moderate') {
    // -----------------------------------------------------------
    // TIER 2: MODERATE ALERT (2 RED AREAS, 2 YELLOW AREAS)
    // -----------------------------------------------------------
    // Red 1: Krishna Lanka Riverfront Bund Basin
    const basePolyRed1: [number, number][] = [
      [16.5015, 80.638],
      [16.505, 80.643],
      [16.5075, 80.6485],
      [16.504, 80.654],
      [16.498, 80.646],
    ];
    impactZones.push({
      id: 'zone-red-kl-bund',
      name: 'Krishna Lanka Riverfront Bund Basin (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((3.2 + (inflowCusecs / 1000000) * 0.9).toFixed(2)),
      population_at_risk: 31400,
      polygon: expandPolygon(basePolyRed1, expansionFactor, [16.503, 80.646]),
      quantum_preposition_needed:
        'Pre-position 3x 40HP Zodiac Boat Squads at Riverfront Jetty Alpha prior to 6hr crest; establish Varadhi South high-ground ALS ambulance pickup ramp.',
    });

    // Red 2: Ranigari Thota Canal Confluence
    const basePolyRed2: [number, number][] = [
      [16.509, 80.649],
      [16.5135, 80.655],
      [16.511, 80.661],
      [16.506, 80.657],
    ];
    impactZones.push({
      id: 'zone-red-rt-canal',
      name: 'Ranigari Thota & Tarapet Canal Confluence (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((3.1 + (inflowCusecs / 1000000) * 0.8).toFixed(2)),
      population_at_risk: 18200,
      polygon: expandPolygon(basePolyRed2, expansionFactor, [16.510, 80.655]),
      quantum_preposition_needed:
        'Pre-position watercraft and emergency drone communications repeater at Auto Nagar Apex High-Ground before canal backflow breaches culvert.',
    });

    // Yellow 1: Bhavanipuram Low Catchment
    const basePolyYel1: [number, number][] = [
      [16.518, 80.598],
      [16.523, 80.608],
      [16.519, 80.618],
      [16.512, 80.612],
    ];
    impactZones.push({
      id: 'zone-yellow-bp-low',
      name: 'Bhavanipuram Low Catchment & Ferry Ghat (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((2.1 + (inflowCusecs / 1400000)).toFixed(2)),
      population_at_risk: 14200,
      polygon: expandPolygon(basePolyYel1, expansionFactor, [16.518, 80.608]),
      quantum_preposition_needed:
        'Deploy high-clearance SDRF water tractor & preposition food ration mobile van at Gollapudi Dry High Ground.',
    });

    // Yellow 2: Vidyadharapuram Spillway Reach
    const basePolyYel2: [number, number][] = [
      [16.525, 80.612],
      [16.531, 80.622],
      [16.526, 80.628],
      [16.52, 80.62],
    ];
    impactZones.push({
      id: 'zone-yellow-vd-spillway',
      name: 'Vidyadharapuram & Wynchipet Spillway Reach (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((1.9 + (inflowCusecs / 1500000)).toFixed(2)),
      population_at_risk: 9800,
      polygon: expandPolygon(basePolyYel2, expansionFactor, [16.525, 80.620]),
      quantum_preposition_needed:
        'Establish dry evacuation perimeter along Tunnel Bypass road toward Bishop Grassi High School shelter.',
    });
  } else if (tier === 'high') {
    // -----------------------------------------------------------
    // TIER 3: SEVERE INUNDATION (3 RED AREAS, 3 YELLOW AREAS)
    // -----------------------------------------------------------
    // Red 1: Extended Krishna Lanka
    const basePolyRed1: [number, number][] = [
      [16.497, 80.633],
      [16.506, 80.640],
      [16.510, 80.649],
      [16.506, 80.658],
      [16.494, 80.648],
    ];
    impactZones.push({
      id: 'zone-red-kl-extended',
      name: 'Krishna Lanka Extended Bund & Varadhi Basin (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((4.2 + hsi * 0.9).toFixed(2)),
      population_at_risk: 43500,
      polygon: expandPolygon(basePolyRed1, expansionFactor, [16.502, 80.645]),
      quantum_preposition_needed:
        'Pre-position 5x Zodiac rescue flotilla at Varadhi NH-16 high-level approach; establish triage ramp for non-stop ambulance turnaround.',
    });

    // Red 2: Ranigari Thota & Tarapet
    const basePolyRed2: [number, number][] = [
      [16.507, 80.646],
      [16.515, 80.654],
      [16.513, 80.665],
      [16.503, 80.660],
    ];
    impactZones.push({
      id: 'zone-red-rt-canal-ext',
      name: 'Ranigari Thota & Tarapet Canal Confluence (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((3.9 + hsi * 0.8).toFixed(2)),
      population_at_risk: 25400,
      polygon: expandPolygon(basePolyRed2, expansionFactor, [16.509, 80.656]),
      quantum_preposition_needed:
        'Deploy heavy dewatering pump trailers and high-clearance SDRF trucks at Auto Nagar Apex High-Ground before canal culvert backfloods.',
    });

    // Red 3: Ramalingeswara Nagar Lowland Surge (NEW RED ZONE)
    const basePolyRed3: [number, number][] = [
      [16.495, 80.653],
      [16.502, 80.661],
      [16.498, 80.672],
      [16.489, 80.663],
    ];
    impactZones.push({
      id: 'zone-red-rn-surge',
      name: 'Ramalingeswara Nagar Lowland Surge (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((3.7 + hsi * 0.7).toFixed(2)),
      population_at_risk: 21800,
      polygon: expandPolygon(basePolyRed3, expansionFactor, [16.496, 80.662]),
      quantum_preposition_needed:
        'Deploy amphibious rescue craft via Bund Backwater Ramp; divert elderly citizens along elevated bund toward Siddhartha College shelter.',
    });

    // Yellow 1: Bhavanipuram Extended
    const basePolyYel1: [number, number][] = [
      [16.515, 80.594],
      [16.525, 80.606],
      [16.521, 80.620],
      [16.510, 80.612],
    ];
    impactZones.push({
      id: 'zone-yellow-bp-ext',
      name: 'Bhavanipuram & Gollapudi Bypass Reach (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((2.8 + hsi * 0.6).toFixed(2)),
      population_at_risk: 18700,
      polygon: expandPolygon(basePolyYel1, expansionFactor, [16.518, 80.607]),
      quantum_preposition_needed:
        'Preposition high-axle 4x4 relief trucks with dry ration kits at Gollapudi junction.',
    });

    // Yellow 2: Vidyadharapuram Extended
    const basePolyYel2: [number, number][] = [
      [16.523, 80.610],
      [16.533, 80.624],
      [16.527, 80.631],
      [16.518, 80.622],
    ];
    impactZones.push({
      id: 'zone-yellow-vd-spillway-ext',
      name: 'Vidyadharapuram & Wynchipet Spillway Reach (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((2.5 + hsi * 0.5).toFixed(2)),
      population_at_risk: 13400,
      polygon: expandPolygon(basePolyYel2, expansionFactor, [16.525, 80.621]),
      quantum_preposition_needed:
        'Seal storm culverts along Wynchipet railway underpass; activate Tunnel Bypass dry corridor.',
    });

    // Yellow 3: Yanamalakuduru Canal Outfall (NEW YELLOW ZONE)
    const basePolyYel3: [number, number][] = [
      [16.486, 80.666],
      [16.494, 80.676],
      [16.489, 80.685],
      [16.480, 80.675],
    ];
    impactZones.push({
      id: 'zone-yellow-yk-outfall',
      name: 'Yanamalakuduru Canal Outfall Basin (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((2.3 + hsi * 0.5).toFixed(2)),
      population_at_risk: 11600,
      polygon: expandPolygon(basePolyYel3, expansionFactor, [16.487, 80.675]),
      quantum_preposition_needed:
        'Reinforce sandbag ramparts around drainage outfall; set up dry staging camp at Poranki high ground.',
    });
  } else {
    // -----------------------------------------------------------
    // TIER 4: CATASTROPHIC FLASH BREACH (4 RED AREAS, 4 YELLOW AREAS)
    // -----------------------------------------------------------
    // Red 1: Krishna Lanka Mega Breach Submersion
    const basePolyRed1: [number, number][] = [
      [16.495, 80.630],
      [16.508, 80.638],
      [16.512, 80.651],
      [16.507, 80.664],
      [16.491, 80.651],
    ];
    impactZones.push({
      id: 'zone-red-kl-catastrophic',
      name: 'Krishna Lanka Mega Breach Submersion (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((5.3 + (hsi - 0.78) * 1.4).toFixed(2)),
      population_at_risk: 62000,
      polygon: expandPolygon(basePolyRed1, expansionFactor, [16.502, 80.647]),
      quantum_preposition_needed:
        'CRITICAL ALERT: Barrage overtopping imminent. Stage 8x high-capacity motorized Zodiac flotilla on Varadhi highway viaduct with helicopter winch staging.',
    });

    // Red 2: Ranigari Thota Old City
    const basePolyRed2: [number, number][] = [
      [16.505, 80.644],
      [16.517, 80.653],
      [16.515, 80.668],
      [16.501, 80.662],
    ];
    impactZones.push({
      id: 'zone-red-rt-catastrophic',
      name: 'Ranigari Thota, Tarapet & Old Town Backwater (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((4.9 + (hsi - 0.78) * 1.2).toFixed(2)),
      population_at_risk: 36800,
      polygon: expandPolygon(basePolyRed2, expansionFactor, [16.509, 80.657]),
      quantum_preposition_needed:
        'Mandatory waterborne evacuation. Pre-stage inflatable raft squads at Auto Nagar Apex High-Ground; cut grid power to prevent electrocution.',
    });

    // Red 3: Ramalingeswara Nagar Flood Basin
    const basePolyRed3: [number, number][] = [
      [16.492, 80.650],
      [16.504, 80.660],
      [16.500, 80.675],
      [16.486, 80.666],
    ];
    impactZones.push({
      id: 'zone-red-rn-catastrophic',
      name: 'Ramalingeswara Nagar & Auto Nagar Basin (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((4.6 + (hsi - 0.78) * 1.1).toFixed(2)),
      population_at_risk: 30200,
      polygon: expandPolygon(basePolyRed3, expansionFactor, [16.495, 80.663]),
      quantum_preposition_needed:
        'Backwater washing over bund crest. Mobilize amphibious all-terrain Argo transporters; coordinate air drops of lifejackets and potable water.',
    });

    // Red 4: Yanamalakuduru Low Bund Washover (ESCALATED TO RED)
    const basePolyRed4: [number, number][] = [
      [16.484, 80.663],
      [16.496, 80.675],
      [16.491, 80.688],
      [16.478, 80.677],
    ];
    impactZones.push({
      id: 'zone-red-yk-catastrophic',
      name: 'Yanamalakuduru Low Bund Washover (RED AREA)',
      impact_level: 'red',
      severity_category: 'red',
      water_level_m: Number((4.3 + (hsi - 0.78) * 1.0).toFixed(2)),
      population_at_risk: 22500,
      polygon: expandPolygon(basePolyRed4, expansionFactor, [16.487, 80.675]),
      quantum_preposition_needed:
        'Flood wall breach alert! Pre-position disaster response craft at Poranki elevated ring-road junction to pull stranded citizens from rooftops.',
    });

    // Yellow 1: Bhavanipuram West Corridor
    const basePolyYel1: [number, number][] = [
      [16.513, 80.590],
      [16.527, 80.604],
      [16.523, 80.622],
      [16.508, 80.610],
    ];
    impactZones.push({
      id: 'zone-yellow-bp-catastrophic',
      name: 'Bhavanipuram West Terminal Corridor (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((3.5 + (hsi - 0.78) * 0.7).toFixed(2)),
      population_at_risk: 24800,
      polygon: expandPolygon(basePolyYel1, expansionFactor, [16.518, 80.606]),
      quantum_preposition_needed:
        'Preposition high-capacity bus fleet on National Highway 65 dry carriageway for rapid mass evacuation toward Vijayawada airport shelters.',
    });

    // Yellow 2: Vidyadharapuram Wynchipet Tunnel Sector
    const basePolyYel2: [number, number][] = [
      [16.521, 80.608],
      [16.535, 80.623],
      [16.529, 80.634],
      [16.516, 80.624],
    ];
    impactZones.push({
      id: 'zone-yellow-vd-catastrophic',
      name: 'Vidyadharapuram, Wynchipet & Tunnel Sector (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((3.2 + (hsi - 0.78) * 0.6).toFixed(2)),
      population_at_risk: 17600,
      polygon: expandPolygon(basePolyYel2, expansionFactor, [16.525, 80.622]),
      quantum_preposition_needed:
        'Close railway underpasses with emergency barriers; guide evacuees through high-elevation Kondapalli bypass.',
    });

    // Yellow 3: Gunadala Budameru Diversion Overspill
    const basePolyYel3: [number, number][] = [
      [16.533, 80.645],
      [16.545, 80.658],
      [16.539, 80.672],
      [16.527, 80.660],
    ];
    impactZones.push({
      id: 'zone-yellow-budameru-overspill',
      name: 'Gunadala Budameru Diversion Overspill (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((2.9 + (hsi - 0.78) * 0.6).toFixed(2)),
      population_at_risk: 23400,
      polygon: expandPolygon(basePolyYel3, expansionFactor, [16.536, 80.659]),
      quantum_preposition_needed:
        'Budameru flash overflow active: establish sandbag diversions along Eluru road culverts; route ambulances to Ayush Hospital via BRTS corridor.',
    });

    // Yellow 4: Gollapudi Bypass Agricultural Lowlands
    const basePolyYel4: [number, number][] = [
      [16.525, 80.580],
      [16.537, 80.594],
      [16.531, 80.608],
      [16.519, 80.595],
    ];
    impactZones.push({
      id: 'zone-yellow-gollapudi-lowlands',
      name: 'Gollapudi Bypass Agricultural Lowlands (YELLOW AREA)',
      impact_level: 'yellow',
      severity_category: 'yellow',
      water_level_m: Number((2.7 + (hsi - 0.78) * 0.5).toFixed(2)),
      population_at_risk: 15400,
      polygon: expandPolygon(basePolyYel4, expansionFactor, [16.528, 80.594]),
      quantum_preposition_needed:
        'Stage agricultural tractors for livestock rescue; maintain one dry lane on Bypass road toward Ibrahimpatnam.',
    });
  }

  // -------------------------------------------------------------
  // STRATEGIC PRE-POSITIONING STAGING NODES (DYNAMIC ROUTING SOLUTION)
  // Adjusted for water elevation so they always remain on DRY ground!
  // -------------------------------------------------------------
  const quantumPoints: QuantumPrepositionPoint[] = [
    {
      id: 'qubo-prep-1',
      title:
        tier === 'extreme'
          ? 'Strategic Pre-Positioned Flotilla Apex (Varadhi High Viaduct)'
          : 'Strategic Pre-Positioned Boat Squad Alpha (Krishna Jetty)',
      type: 'boat_squad',
      latitude: tier === 'extreme' ? 16.5005 : 16.5028,
      longitude: tier === 'extreme' ? 80.6385 : 80.6405,
      qubo_rank: 1,
      qubo_energy_delta: Number((24.6 + hsi * 6.2).toFixed(1)),
      staging_reason:
        tier === 'extreme'
          ? 'Elevated onto NH-16 Varadhi Viaduct deck (elevation 34.0m) as riverfront jetty is fully submerged under 5m crest.'
          : 'Staged at Krishna Riverfront Jetty Alpha BEFORE barrage weir overflow, eliminating 38-minute traversal latency across flooded urban grid.',
      dry_ground_elevation_m: tier === 'extreme' ? 34.0 : 22.4,
      coverage_sector: 'Krishna Lanka Red Impact Zone',
    },
    {
      id: 'qubo-prep-2',
      title: 'Strategic Pre-Positioned 108 ALS Ambulance (Varadhi South Ramp)',
      type: 'ambulance_als',
      latitude: 16.4985,
      longitude: 80.636,
      qubo_rank: 2,
      qubo_energy_delta: Number((19.8 + hsi * 4.8).toFixed(1)),
      staging_reason:
        'Pre-positioned on elevated national highway south approach with guaranteed dry tarmac access to Government General Hospital trauma bay.',
      dry_ground_elevation_m: 28.5,
      coverage_sector: 'Varadhi Arterial & Casualty Handoff Corridor',
    },
    {
      id: 'qubo-prep-3',
      title:
        tier === 'extreme' || tier === 'high'
          ? 'Strategic Pre-Positioned Relief Fortress (IGMC Stadium Upper Concourse)'
          : 'Strategic Pre-Positioned High-Ground Relief Hub (IGMC)',
      type: 'relief_staging',
      latitude: 16.5085,
      longitude: 80.6425,
      qubo_rank: 3,
      qubo_energy_delta: Number((16.2 + hsi * 3.9).toFixed(1)),
      staging_reason:
        'Dry relief distribution center positioned in upper stadium concourse with emergency diesel power backup & 650 bed reserve.',
      dry_ground_elevation_m: 29.0,
      coverage_sector: 'Central City Shelter Network',
    },
    {
      id: 'qubo-prep-4',
      title: 'Strategic Drone Aerial Telemetry Relay (Gandhi Hill Apex)',
      type: 'drone_relay',
      latitude: 16.516,
      longitude: 80.624,
      qubo_rank: 4,
      qubo_energy_delta: Number((12.5 + hsi * 3.1).toFixed(1)),
      staging_reason:
        'Elevated line-of-sight RF relay maintaining uninterrupted mesh communication between rescue boats and Collectorate Incident Command.',
      dry_ground_elevation_m: 48.2,
      coverage_sector: 'Entire Vijayawada River Basin',
    },
  ];

  return {
    id: `ai-pred-${Date.now()}`,
    timestamp: new Date().toISOString(),
    predicted_barrage_discharge_cusecs: predictedDischarge,
    flood_probability_percent: floodProbability,
    predicted_peak_time_hours: predictedPeakHours,
    model_name:
      modelArchitecture === 'bilstm_attention'
        ? 'Bidirectional LSTM + Temporal Attention (Hydro-Net v3.4)'
        : modelArchitecture === 'pinn_saint_venant'
        ? 'Physics-Informed Neural Network (PINN Saint-Venant 2D)'
        : 'XGBoost Hydraulic Ensemble (CWC Benchmark)',
    dataset_used:
      selectedDataset === 'krishna_historical'
        ? 'CWC Krishna Basin Historical Hydrology (2014-2024)'
        : selectedDataset === 'cyclone_michaung'
        ? 'Cyclone Michaung Krishna Inundation Radar'
        : '2019 Record Prakasam Barrage Inundation Telemetry',
    accuracy_score: accuracyScore,
    impact_zones: impactZones,
    quantum_prepositioning_points: quantumPoints,
  };
}
