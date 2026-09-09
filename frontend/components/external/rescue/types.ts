export interface Mission {
  id: string;
  code: string;
  title: string;
  description: string;
  sector: string;
  incidentType: string;
  priority: 'high' | 'medium' | 'low';
  tag?: string;
  affected: number;
  distance: string;
  eta: string;
  accessReq: string;
  hazardDetail: string;
  locationDetails: string;
}

export interface RouteStep {
  id: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'upcoming';
  distanceRem?: string;
  maneuverDistance?: string;
  clearanceNote?: string;
}

export interface ShelterManifest {
  civiliansTrapped: number;
  criticalMedical: number;
  mobilityAssist: number;
  shelterStructural: string;
  rescueCoordinator: {
    name: string;
    phone: string;
    callsign: string;
  };
}

export interface SystemTelemetry {
  channel: string;
  frequency: string;
  gridSector: string;
  syncRate: string;
  commsStatus: string;
  gpsStatus: string;
  navStatus: string;
  heading: string;
  speed: string;
}
