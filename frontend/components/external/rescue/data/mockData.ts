import { Mission, RouteStep, ShelterManifest, SystemTelemetry } from '../types';

export const SYSTEM_TELEMETRY: SystemTelemetry = {
  channel: 'CH-08 TACTICAL',
  frequency: '462.5625 MHz',
  gridSector: 'GRID SECTOR 04-B',
  syncRate: 'LIVE 100Hz',
  commsStatus: 'ONLINE',
  gpsStatus: 'ACTIVE',
  navStatus: 'READY',
  heading: '042° NE',
  speed: '38 KM/H',
};

export const RESCUE_LEAD = {
  name: 'Capt. Maya Jensen',
  role: 'RAPID SAR LEAD',
  callsign: 'VANGUARD-1',
  unit: 'NTR DISTRICT RESCUE SQUADRON',
  status: 'ONLINE',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
};

export const ACTIVE_STATS = {
  activeMissions: {
    count: 3,
    label: 'IN-FLIGHT',
    fillPercentage: 72,
  },
  highPriority: {
    count: 1,
    label: 'CRITICAL',
    fillPercentage: 88,
  },
  rescuersActive: {
    count: 8,
    label: 'DEPLOYED',
    fillPercentage: 76,
  },
  avgResponse: {
    value: 12,
    unit: 'min',
    comparison: '-3.4m vs target',
    trend: 'faster',
  },
};

export const FEATURED_MISSION: Mission = {
  id: 'mission-riverside',
  code: '#OP-9942',
  title: 'Riverside High School Gym',
  description: 'Rapid water ingress reaching structural tier 2. 42 trapped occupants require immediate extraction to LZ Alpha.',
  sector: 'SEC-4B',
  incidentType: 'FLASH FLOOD',
  priority: 'high',
  tag: 'URGENT EXTRACTION',
  affected: 42,
  distance: '2.3 km',
  eta: '07 min',
  accessReq: 'Wheelchair Req.',
  hazardDetail: 'Flood Ingress Sector 4B',
  locationDetails: 'Zone Bravo • Evacuation Shelter Alpha',
};

export const AVAILABLE_MISSIONS: Mission[] = [
  {
    id: 'mission-riverside',
    code: '#OP-9942',
    title: 'Riverside High School Gym',
    description: '42 civilians stranded • Flash flood water cresting at outer levees',
    sector: 'SEC-4B',
    incidentType: 'FLASH FLOOD',
    priority: 'high',
    tag: 'URGENT EXTRACTION',
    affected: 42,
    distance: '2.3 km away',
    eta: 'ETA 07 min',
    accessReq: 'Wheelchair Req.',
    hazardDetail: 'Flood Ingress Sector 4B',
    locationDetails: 'Zone Bravo • Evacuation Shelter Alpha',
  },
  {
    id: 'mission-harbor',
    code: '#OP-9891',
    title: 'Harbor Warehouse B-12',
    description: '18 civilians trapped • Structural beam hazard blocking northern portal',
    sector: 'SEC-1A',
    incidentType: 'STRUCTURAL HAZARD',
    priority: 'medium',
    affected: 18,
    distance: '4.1 km away',
    eta: 'ETA 12 min',
    accessReq: 'Heavy rescue gear needed',
    hazardDetail: 'Structural beam collapse',
    locationDetails: 'Sector 1A Industrial Docks',
  },
  {
    id: 'mission-shelter-alpha',
    code: '#OP-9764',
    title: 'Community Shelter Alpha',
    description: 'Supply drop required • 60 medical blanket packs & water filtration pallets',
    sector: 'SEC-09',
    incidentType: 'LOGISTICS AIRDROP',
    priority: 'low',
    affected: 0,
    distance: '6.2 km away',
    eta: 'ETA 18 min',
    accessReq: 'Staging Hub West',
    hazardDetail: 'Secondary power outage',
    locationDetails: 'Sector 09 Civic Center',
  },
];

export const MISSION_ROUTE_STEPS: RouteStep[] = [
  {
    id: 1,
    title: 'Step 1: Depart Rescue Base',
    subtitle: 'Dispatched 08:14 • Base North Gate',
    status: 'completed',
  },
  {
    id: 2,
    title: 'Turn Right onto River Road',
    subtitle: 'Elevated embankment clearance safe',
    status: 'current',
    maneuverDistance: '350m',
  },
  {
    id: 3,
    title: 'Step 3: Riverside High School Gym',
    subtitle: 'Destination staging area • 1.95 km remainder',
    status: 'upcoming',
    distanceRem: '1.95 km remainder',
  },
];

export const SHELTER_MANIFEST: ShelterManifest = {
  civiliansTrapped: 42,
  criticalMedical: 3,
  mobilityAssist: 4,
  shelterStructural: 'SECURE (2nd Fl)',
  rescueCoordinator: {
    name: 'Marcus Vance',
    phone: '555-0193',
    callsign: 'SHELTER-LEAD',
  },
};
