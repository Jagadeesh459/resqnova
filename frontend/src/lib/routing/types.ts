export type RoadStatus = 'open' | 'restricted' | 'blocked' | 'flooded';

export interface GraphNode {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  elevation_m?: number;
}

export interface GraphEdge {
  roadId: string;
  from: string;
  to: string;
  distance: number; // distance in meters
  travelTime: number; // travel time in seconds
  status: RoadStatus;
  geometry: [number, number][]; // [lat, lng] coordinates for Leaflet
  roadName?: string;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
}

export interface GraphBuildStats {
  totalIntersections: number;
  totalRoads: number;
  totalBlockedRoadsSkipped: number;
  totalGraphEdges: number;
  totalGeometryPoints?: number;
}

export interface RouteStep {
  roadId: string;
  roadName: string;
  distanceMeters: number;
  travelTimeSeconds: number;
  from: string;
  to: string;
  geometry: [number, number][];
  status?: RoadStatus;
}

export type ManeuverType =
  | 'depart'
  | 'straight'
  | 'turn-left'
  | 'turn-right'
  | 'slight-left'
  | 'slight-right'
  | 'u-turn'
  | 'arrive';

export interface TurnInstruction {
  instruction: string;
  maneuver: ManeuverType;
  roadName: string;
  distanceMeters: number;
  travelTimeSeconds: number;
}

export interface RouteResult {
  pathNodes: string[];
  roadIds: string[];
  geometry: [number, number][];
  distanceMeters: number;
  travelTimeSeconds: number;
  visitedNodes: string[];
  computationTimeMs: number;
  startNode: GraphNode;
  targetNode: GraphNode;
  stepSegments: RouteStep[];
  instructions: TurnInstruction[];
  startingRoadName: string;
  startSnapDistanceMeters?: number;
  targetSnapDistanceMeters?: number;

  // Phase 4 Dynamic A* Attributes
  routeType: 'safe' | 'restricted' | 'emergency';
  stage: 1 | 2 | 3;
  blockedRoadsAvoided: number;
  restrictedRoadsUsed: number;
  warning?: string;
  isEmergency?: boolean;
}
