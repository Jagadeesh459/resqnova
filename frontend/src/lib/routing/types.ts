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
  status: 'open' | 'blocked';
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

