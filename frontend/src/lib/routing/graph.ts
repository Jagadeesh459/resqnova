import { Graph, GraphNode, GraphEdge, GraphBuildStats, RoadStatus } from './types';
import { geoJsonToLeafletCoordinates, haversineDistance } from './utils';
import { supabase } from '../supabase';

let cachedRawIntersections: any[] | null = null;
let cachedRawRoads: any[] | null = null;
let cachedBuiltGraph: { graph: Graph; stats: GraphBuildStats } | null = null;

export function invalidateGraphCache(): void {
  cachedRawIntersections = null;
  cachedRawRoads = null;
  cachedBuiltGraph = null;
}

export function getCachedRoads(): any[] | null {
  return cachedRawRoads;
}

/**
 * Updates the status of a road in-memory across the graph edges in O(1)
 */
export function updateGraphEdgeStatus(
  graph: Graph,
  roadId: string,
  newStatus: RoadStatus
): boolean {
  let updated = false;
  const targetId = roadId.trim();
  const revTargetId = targetId.endsWith('_rev') ? targetId : `${targetId}_rev`;
  const baseTargetId = targetId.replace(/_rev$/, '');

  // Update in graph adjacency
  for (const edges of graph.adjacency.values()) {
    for (const edge of edges) {
      if (
        edge.roadId === targetId ||
        edge.roadId === revTargetId ||
        edge.roadId === baseTargetId ||
        edge.roadId.replace(/_rev$/, '') === baseTargetId
      ) {
        edge.status = newStatus;
        updated = true;
      }
    }
  }

  // Update in cached roads array
  if (cachedRawRoads) {
    for (const r of cachedRawRoads) {
      const rid = String(r.road_id || r.id || '');
      if (rid === baseTargetId || rid === targetId) {
        r.status = newStatus;
      }
    }
  }

  return updated;
}

/**
 * Helper to fetch all rows with pagination from a Supabase table
 */
async function fetchAllRows(tableName: string, selectFields = '*'): Promise<any[]> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const allRows: any[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select(selectFields)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch from ${tableName} [range ${from}-${to}]: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }
  }

  return allRows;
}

/**
 * Builds the Vijayawada Topological Graph Engine directly from Supabase PostgreSQL tables.
 * Supabase is the single source of truth:
 * - Queries 'intersections' (vertices V) with full pagination (17,597 nodes)
 * - Queries 'roads' (directed topological edges E) with full pagination (23,858 edges)
 * - Retains ALL roads inside graph data structure with their respective statuses (open, restricted, blocked, flooded)
 * - Preserves full GeoJSON curvature geometry converted to Leaflet [lat, lng]
 */
export async function buildGraph(
  customRoadOverrides?: any[],
  forceRefresh = false
): Promise<{ graph: Graph; stats: GraphBuildStats }> {
  if (customRoadOverrides && customRoadOverrides.length > 0) {
    return constructGraphFromRawData(cachedRawIntersections || [], customRoadOverrides);
  }

  if (cachedBuiltGraph && !forceRefresh) {
    return cachedBuiltGraph;
  }

  if (!supabase) {
    throw new Error('Supabase client is not configured. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  // 1. Fetch all Intersections from Supabase
  if (!cachedRawIntersections || forceRefresh) {
    cachedRawIntersections = await fetchAllRows('intersections', 'node_id,name,latitude,longitude,elevation_m');
  }

  // 2. Fetch all Roads from Supabase
  if (!cachedRawRoads || forceRefresh) {
    cachedRawRoads = await fetchAllRows(
      'roads',
      'road_id,road_name,source_node,target_node,start_lat,start_lng,end_lat,end_lng,distance_m,travel_time_sec,status,coordinates'
    );
  }

  if (!cachedRawRoads || cachedRawRoads.length === 0) {
    throw new Error('Supabase table "roads" is currently empty. Run the OSM upload script to populate Vijayawada roads.');
  }

  const result = constructGraphFromRawData(cachedRawIntersections, cachedRawRoads);
  cachedBuiltGraph = result;
  return result;
}

function constructGraphFromRawData(
  rawIntersections: any[],
  rawRoads: any[]
): { graph: Graph; stats: GraphBuildStats } {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  let totalBlockedRoadsSkipped = 0;
  let totalGraphEdges = 0;
  let totalGeometryPoints = 0;

  // Populate Nodes
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

  // Populate Edges (Preserve all roads in the graph, tagged with their status)
  const totalRoads = rawRoads.length;

  for (const road of rawRoads) {
    const roadId = String(road.road_id || road.id || '');
    const rawStatus = String(road.status || 'open').toLowerCase();
    const status: RoadStatus =
      rawStatus === 'blocked'
        ? 'blocked'
        : rawStatus === 'flooded'
        ? 'flooded'
        : rawStatus === 'restricted'
        ? 'restricted'
        : 'open';

    if (status === 'blocked' || status === 'flooded') {
      totalBlockedRoadsSkipped++;
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

    // Preserve exact road geometry
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
      status,
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
      status,
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
