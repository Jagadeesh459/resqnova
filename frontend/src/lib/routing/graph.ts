import { Graph, GraphNode, GraphEdge, GraphBuildStats } from './types';
import { geoJsonToLeafletCoordinates, haversineDistance } from './utils';
import { supabase } from '../supabase';
import bundledNetwork from './vijayawada_road_network.json';

/**
 * Builds the high-resolution Vijayawada Graph Engine from OpenStreetMap & Supabase.
 * - Queries Supabase PostgreSQL tables ('intersections' and 'roads')
 * - Falls back seamlessly to bundled full OSM Vijayawada network dataset if cloud tables are cold
 * - Filters out blocked/flooded road edges
 * - Preserves full GeoJSON road curvature geometry converted to Leaflet [lat, lng]
 */
export async function buildGraph(
  customRoadOverrides?: any[],
  customIntersectionOverrides?: GraphNode[]
): Promise<{ graph: Graph; stats: GraphBuildStats; source: 'supabase' | 'osm_dataset' }> {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  let totalRoads = 0;
  let totalBlockedRoadsSkipped = 0;
  let totalGraphEdges = 0;
  let totalGeometryPoints = 0;
  let dataSource: 'supabase' | 'osm_dataset' = 'osm_dataset';

  // ------------------------------------------------------------------
  // 1. Load Intersections (Vertices V)
  // ------------------------------------------------------------------
  let rawIntersections: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('intersections').select('*').limit(10000);
      if (!error && data && data.length > 0) {
        rawIntersections = data;
        dataSource = 'supabase';
      }
    } catch {
      // Handled via bundled OSM dataset
    }
  }

  // Use custom overrides or bundled OSM Vijayawada intersections
  if (rawIntersections.length === 0) {
    rawIntersections = customIntersectionOverrides && customIntersectionOverrides.length > 0
      ? customIntersectionOverrides
      : bundledNetwork.intersections;
  }

  for (const item of rawIntersections) {
    const id = String(item.node_id || item.id || '');
    if (!id) continue;
    const node: GraphNode = {
      id,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      name: item.name || `Junction ${id}`,
      elevation_m: item.elevation_m ? Number(item.elevation_m) : 22.0,
    };
    nodes.set(node.id, node);
    adjacency.set(node.id, []);
  }

  // ------------------------------------------------------------------
  // 2. Load Roads (Directed Topological Edges E)
  // ------------------------------------------------------------------
  let rawRoads: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('roads').select('*').limit(10000);
      if (!error && data && data.length > 0) {
        rawRoads = data;
        dataSource = 'supabase';
      }
    } catch {
      // Handled via bundled OSM dataset
    }
  }

  if (rawRoads.length === 0) {
    rawRoads = customRoadOverrides && customRoadOverrides.length > 0
      ? customRoadOverrides
      : bundledNetwork.roads;
  }

  totalRoads = rawRoads.length;

  for (const road of rawRoads) {
    const roadId = String(road.road_id || road.id || '');
    const status = String(road.status || 'open').toLowerCase();

    // STEP 7: IGNORE BLOCKED ROADS
    if (status === 'blocked' || status === 'flooded') {
      totalBlockedRoadsSkipped++;
      continue;
    }

    let fromNode = road.source_node ? String(road.source_node) : '';
    let toNode = road.target_node ? String(road.target_node) : '';

    const startLat = Number(road.start_lat);
    const startLng = Number(road.start_lng);
    const endLat = Number(road.end_lat);
    const endLng = Number(road.end_lng);

    // Auto-create/bind node if missing from index
    if (!fromNode || !nodes.has(fromNode)) {
      fromNode = fromNode || `N_AUTO_${roadId}_START`;
      if (!nodes.has(fromNode)) {
        nodes.set(fromNode, {
          id: fromNode,
          latitude: startLat,
          longitude: startLng,
          name: `${road.road_name || roadId} (Start)`,
        });
        adjacency.set(fromNode, []);
      }
    }

    if (!toNode || !nodes.has(toNode)) {
      toNode = toNode || `N_AUTO_${roadId}_END`;
      if (!nodes.has(toNode)) {
        nodes.set(toNode, {
          id: toNode,
          latitude: endLat,
          longitude: endLng,
          name: `${road.road_name || roadId} (End)`,
        });
        adjacency.set(toNode, []);
      }
    }

    // STEP 6: PRESERVE EXACT OSM ROAD CURVATURE GEOMETRY
    const geometry = geoJsonToLeafletCoordinates(road.coordinates);
    const edgeGeometry: [number, number][] =
      geometry.length >= 2
        ? geometry
        : [
            [startLat, startLng],
            [endLat, endLng],
          ];

    totalGeometryPoints += edgeGeometry.length;

    // Distances and Travel Times (Meters & Seconds)
    const distanceMeters = road.distance_m
      ? Number(road.distance_m)
      : haversineDistance(startLat, startLng, endLat, endLng);

    const travelTimeSeconds = road.travel_time_sec
      ? Number(road.travel_time_sec)
      : Math.max(2, Math.round(distanceMeters / 11.11)); // ~40 km/h baseline

    const roadName = road.road_name || 'Vijayawada Corridor';

    // Forward Edge
    const forwardEdge: GraphEdge = {
      roadId,
      from: fromNode,
      to: toNode,
      distance: Math.max(5, Math.round(distanceMeters)),
      travelTime: Math.max(1, Math.round(travelTimeSeconds)),
      status: 'open',
      geometry: edgeGeometry,
      roadName,
    };

    adjacency.get(fromNode)?.push(forwardEdge);
    totalGraphEdges++;

    // Bidirectional Reverse Edge (for standard two-way OSM drivable streets)
    const reverseEdge: GraphEdge = {
      roadId: `${roadId}_rev`,
      from: toNode,
      to: fromNode,
      distance: Math.max(5, Math.round(distanceMeters)),
      travelTime: Math.max(1, Math.round(travelTimeSeconds)),
      status: 'open',
      geometry: [...edgeGeometry].reverse(),
      roadName,
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
    totalGeometryPoints,
  };

  return { graph, stats, source: dataSource };
}
