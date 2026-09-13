import { Graph, GraphNode, GraphEdge, GraphBuildStats } from './types';
import { geoJsonToLeafletCoordinates, haversineDistance } from './utils';
import { supabase } from '../supabase';

// Default Master Intersections for Vijayawada (NTR District)
export const DEFAULT_VIJAYAWADA_INTERSECTIONS: GraphNode[] = [
  { id: 'N001', name: 'Prakasam Barrage South Head', latitude: 16.4982, longitude: 80.6122, elevation_m: 21.0 },
  { id: 'N002', name: 'Prakasam Barrage North Head', latitude: 16.5075, longitude: 80.6185, elevation_m: 23.5 },
  { id: 'N003', name: 'Krishna Lanka Bund Entrance', latitude: 16.4995, longitude: 80.6355, elevation_m: 18.2 },
  { id: 'N004', name: 'Ranigari Thota Junction', latitude: 16.4925, longitude: 80.6485, elevation_m: 16.8 },
  { id: 'N005', name: 'Governorpet Collectorate Junction', latitude: 16.5135, longitude: 80.6312, elevation_m: 25.0 },
  { id: 'N006', name: 'Benz Circle Elevated Junction', latitude: 16.5005, longitude: 80.6555, elevation_m: 27.5 },
  { id: 'N007', name: 'Kanaka Durga Temple Flyover North', latitude: 16.5215, longitude: 80.6125, elevation_m: 29.0 },
  { id: 'N008', name: 'Bhavanipuram Ferry Terminal', latitude: 16.5185, longitude: 80.6055, elevation_m: 19.5 },
  { id: 'N009', name: 'Eluru Canal Lock Gate', latitude: 16.5125, longitude: 80.6415, elevation_m: 22.0 },
  { id: 'N010', name: 'BRTS Corridor Central Station', latitude: 16.5285, longitude: 80.6325, elevation_m: 26.0 },
  { id: 'N011', name: 'Budameru Rivulet North Causeway', latitude: 16.5385, longitude: 80.6385, elevation_m: 15.0 },
  { id: 'N012', name: 'One Town Brahmin Street Cross', latitude: 16.5155, longitude: 80.6145, elevation_m: 24.0 },
  { id: 'N013', name: 'GGH Apex Trauma Emergency Gate', latitude: 16.5193, longitude: 80.6305, elevation_m: 26.5 },
  { id: 'N014', name: 'IGMC Stadium Relief Concourse', latitude: 16.5085, longitude: 80.6425, elevation_m: 26.0 },
];

/**
 * Builds the graph from Supabase PostgreSQL tables ('roads' and 'intersections')
 * Skips blocked roads and preserves full road curvature geometry for Leaflet.
 */
export async function buildGraph(
  fallbackRoads?: any[],
  fallbackIntersections?: GraphNode[]
): Promise<{ graph: Graph; stats: GraphBuildStats }> {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  let totalRoads = 0;
  let totalBlockedRoadsSkipped = 0;
  let totalGraphEdges = 0;

  // -------------------------------------------------------------
  // 1. Fetch & Initialize Intersections (Nodes V)
  // -------------------------------------------------------------
  let rawIntersections: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('intersections').select('*');
      if (!error && data && data.length > 0) {
        rawIntersections = data;
      }
    } catch {
      // Fallback handled below
    }
  }

  if (rawIntersections.length === 0) {
    rawIntersections = fallbackIntersections || DEFAULT_VIJAYAWADA_INTERSECTIONS;
  }

  // Populate Nodes Map
  for (const item of rawIntersections) {
    const id = item.node_id || item.id;
    if (!id) continue;
    const node: GraphNode = {
      id: String(id),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      name: item.name || `Intersection ${id}`,
      elevation_m: item.elevation_m ? Number(item.elevation_m) : undefined,
    };
    nodes.set(node.id, node);
    adjacency.set(node.id, []);
  }

  // -------------------------------------------------------------
  // 2. Fetch & Build Roads (Edges E)
  // -------------------------------------------------------------
  let rawRoads: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('roads').select('*');
      if (!error && data && data.length > 0) {
        rawRoads = data;
      }
    } catch {
      // Fallback handled below
    }
  }

  if (rawRoads.length === 0 && fallbackRoads && fallbackRoads.length > 0) {
    rawRoads = fallbackRoads;
  }

  totalRoads = rawRoads.length;

  for (const road of rawRoads) {
    const roadId = String(road.road_id || road.id || '');
    const status = (road.status || 'open').toLowerCase();

    // STEP 4: IGNORE BLOCKED ROADS
    if (status === 'blocked' || status === 'flooded') {
      totalBlockedRoadsSkipped++;
      continue;
    }

    // Determine Source and Target Nodes
    let fromNode = road.source_node ? String(road.source_node) : '';
    let toNode = road.target_node ? String(road.target_node) : '';

    const startLat = Number(road.start_lat);
    const startLng = Number(road.start_lng);
    const endLat = Number(road.end_lat);
    const endLng = Number(road.end_lng);

    // If source/target nodes are missing, auto-bind or create dynamic intersection nodes
    if (!fromNode || !nodes.has(fromNode)) {
      fromNode = `NODE_${roadId}_START`;
      if (!nodes.has(fromNode)) {
        nodes.set(fromNode, {
          id: fromNode,
          latitude: startLat,
          longitude: startLng,
          name: `${road.road_name || roadId} Start`,
        });
        adjacency.set(fromNode, []);
      }
    }

    if (!toNode || !nodes.has(toNode)) {
      toNode = `NODE_${roadId}_END`;
      if (!nodes.has(toNode)) {
        nodes.set(toNode, {
          id: toNode,
          latitude: endLat,
          longitude: endLng,
          name: `${road.road_name || roadId} End`,
        });
        adjacency.set(toNode, []);
      }
    }

    // STEP 3: PRESERVE EXACT ROAD GEOMETRY
    const geometry = geoJsonToLeafletCoordinates(road.coordinates);

    // If geometry is empty, use start and end coordinates as baseline
    const edgeGeometry: [number, number][] =
      geometry.length >= 2
        ? geometry
        : [
            [startLat, startLng],
            [endLat, endLng],
          ];

    // Calculate distance in meters (single source of truth)
    const distanceMeters = road.distance_m
      ? Number(road.distance_m)
      : road.distance_km
      ? Number(road.distance_km) * 1000
      : haversineDistance(startLat, startLng, endLat, endLng);

    const travelTimeSeconds = road.travel_time_sec
      ? Number(road.travel_time_sec)
      : road.travel_time
      ? Number(road.travel_time) * 60
      : Math.round(distanceMeters / 11.11); // default ~40 km/h = 11.11 m/s

    // Forward Edge
    const forwardEdge: GraphEdge = {
      roadId,
      from: fromNode,
      to: toNode,
      distance: Math.round(distanceMeters),
      travelTime: Math.round(travelTimeSeconds),
      status: 'open',
      geometry: edgeGeometry,
      roadName: road.road_name || roadId,
    };

    adjacency.get(fromNode)?.push(forwardEdge);
    totalGraphEdges++;

    // Bidirectional Reverse Edge
    const reverseEdge: GraphEdge = {
      roadId: `${roadId}_rev`,
      from: toNode,
      to: fromNode,
      distance: Math.round(distanceMeters),
      travelTime: Math.round(travelTimeSeconds),
      status: 'open',
      geometry: [...edgeGeometry].reverse(),
      roadName: road.road_name || roadId,
    };

    adjacency.get(toNode)?.push(reverseEdge);
    totalGraphEdges++;
  }

  const graph: Graph = {
    nodes,
    adjacency,
  };

  const stats: GraphBuildStats = {
    totalIntersections: nodes.size,
    totalRoads,
    totalBlockedRoadsSkipped,
    totalGraphEdges,
  };

  return { graph, stats };
}
