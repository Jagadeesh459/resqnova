import { Graph, GraphNode, GraphEdge, GraphBuildStats } from './types';
import { geoJsonToLeafletCoordinates, haversineDistance } from './utils';
import { supabase } from '../supabase';

/**
 * Builds the Vijayawada Topological Graph Engine directly from Supabase PostgreSQL tables.
 * Supabase is the single source of truth:
 * - Queries 'intersections' (vertices V)
 * - Queries 'roads' (directed topological edges E)
 * - Excludes blocked or flooded road segments
 * - Preserves full GeoJSON curvature geometry converted to Leaflet [lat, lng]
 * - If Supabase fails or tables are unpopulated, throws an explicit error (no silent JSON fallback).
 */
export async function buildGraph(
  customRoadOverrides?: any[]
): Promise<{ graph: Graph; stats: GraphBuildStats }> {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  let totalBlockedRoadsSkipped = 0;
  let totalGraphEdges = 0;
  let totalGeometryPoints = 0;

  // ------------------------------------------------------------------
  // 1. Fetch Intersections from Supabase (Vertices V)
  // ------------------------------------------------------------------
  const { data: rawIntersections, error: nodeError } = await supabase
    .from('intersections')
    .select('*')
    .limit(50000);

  if (nodeError) {
    throw new Error(`Failed to fetch intersections from Supabase table 'intersections': ${nodeError.message}`);
  }

  if (!rawIntersections || rawIntersections.length === 0) {
    // If roads exist with start/end coordinates, we will derive nodes below, but log a warning
    console.warn('[Routing Engine] Table "intersections" returned 0 rows from Supabase.');
  } else {
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
  }

  // ------------------------------------------------------------------
  // 2. Fetch Roads from Supabase (Topological Edges E)
  // ------------------------------------------------------------------
  let rawRoads: any[] = [];
  if (customRoadOverrides && customRoadOverrides.length > 0) {
    rawRoads = customRoadOverrides;
  } else {
    const { data: roadsData, error: roadError } = await supabase
      .from('roads')
      .select('*')
      .limit(50000);

    if (roadError) {
      throw new Error(`Failed to fetch roads from Supabase table 'roads': ${roadError.message}`);
    }

    if (!roadsData || roadsData.length === 0) {
      throw new Error('Supabase table "roads" is currently empty. Run the OSM upload script to populate Vijayawada roads.');
    }

    rawRoads = roadsData;
  }

  const totalRoads = rawRoads.length;

  for (const road of rawRoads) {
    const roadId = String(road.road_id || road.id || '');
    const status = String(road.status || 'open').toLowerCase();

    // EXCLUDE BLOCKED ROADS
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

    // Auto-bind node if missing from the intersections map
    if (!fromNode || !nodes.has(fromNode)) {
      fromNode = fromNode || `N_${roadId}_START`;
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
      toNode = toNode || `N_${roadId}_END`;
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

    // PRESERVE EXACT ROAD CURVATURE GEOMETRY
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
      : road.distance_km
      ? Number(road.distance_km) * 1000
      : haversineDistance(startLat, startLng, endLat, endLng);

    const travelTimeSeconds = road.travel_time_sec
      ? Number(road.travel_time_sec)
      : road.travel_time
      ? Number(road.travel_time) * 60
      : Math.max(2, Math.round(distanceMeters / 11.11));

    const roadName = road.road_name || road.name || roadId;

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

    // Bidirectional Reverse Edge
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

  return { graph, stats };
}
