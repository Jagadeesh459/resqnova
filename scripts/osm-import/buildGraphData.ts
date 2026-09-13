import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OsmData, OsmNode, OsmWay, fetchVijayawadaOsmData } from './parseOsm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ProcessedIntersection {
  node_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  district: string;
}

export interface ProcessedRoad {
  road_id: string;
  road_name: string;
  district: string;
  source_node: string;
  target_node: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance_m: number;
  travel_time_sec: number;
  status: 'open' | 'blocked' | 'flooded';
  road_type: string;
  coordinates: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat] GeoJSON standard
  };
}

export interface VijayawadaGraphDataset {
  metadata: {
    region: string;
    generatedAt: string;
    totalIntersections: number;
    totalRoads: number;
    totalGeometryPoints: number;
  };
  intersections: ProcessedIntersection[];
  roads: ProcessedRoad[];
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSpeedMps(highway: string): number {
  switch (highway) {
    case 'motorway':
    case 'motorway_link':
    case 'trunk':
    case 'trunk_link':
      return 60 / 3.6; // ~16.67 m/s
    case 'primary':
    case 'primary_link':
      return 50 / 3.6; // ~13.89 m/s
    case 'secondary':
    case 'secondary_link':
      return 40 / 3.6; // ~11.11 m/s
    case 'tertiary':
    case 'tertiary_link':
      return 35 / 3.6; // ~9.72 m/s
    case 'residential':
    case 'living_street':
    case 'unclassified':
      return 25 / 3.6; // ~6.94 m/s
    case 'service':
      return 20 / 3.6; // ~5.56 m/s
    default:
      return 30 / 3.6; // ~8.33 m/s
  }
}

export function buildVijayawadaGraphData(osmData: OsmData): VijayawadaGraphDataset {
  const { nodes: rawNodes, ways: rawWays } = osmData;

  console.log('[Graph Builder] Identifying network junctions and intersections...');

  // 1. Count node occurrences across all ways to identify junctions
  const nodeUsageCount = new Map<number, number>();
  for (const way of rawWays) {
    for (const nodeId of way.nodes) {
      nodeUsageCount.set(nodeId, (nodeUsageCount.get(nodeId) || 0) + 1);
    }
  }

  // Intersections are:
  // - First/Last node of any way
  // - Any node used by 2 or more ways
  const isIntersectionNode = (nodeId: number, way: OsmWay, index: number) => {
    if (index === 0 || index === way.nodes.length - 1) return true;
    const usage = nodeUsageCount.get(nodeId) || 0;
    return usage > 1;
  };

  const intersectionMap = new Map<string, ProcessedIntersection>();
  const processedRoads: ProcessedRoad[] = [];
  let roadCounter = 1;
  let totalGeometryPoints = 0;

  // Filter & prioritize major drivable ways for a clean, highly reliable Vijayawada routing network
  const highwayPriorityOrder = [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'residential', 'unclassified', 'service',
    'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'
  ];

  for (const way of rawWays) {
    const highway = way.tags?.highway || 'road';
    if (!highwayPriorityOrder.includes(highway)) continue;

    const roadBaseName = way.tags?.name || way.tags?.['name:en'] || way.tags?.ref || `Vijayawada ${highway} route`;
    const speedMps = getSpeedMps(highway);

    // Split way into segments between intersection nodes
    let currentSegmentNodes: number[] = [];

    for (let i = 0; i < way.nodes.length; i++) {
      const nodeId = way.nodes[i];
      const nodeObj = rawNodes.get(nodeId);
      if (!nodeObj) continue;

      currentSegmentNodes.push(nodeId);

      const isJunction = isIntersectionNode(nodeId, way, i);

      // When we hit a junction and we have at least 2 nodes in the current segment, form a road edge!
      if (isJunction && currentSegmentNodes.length >= 2) {
        const startOsmId = currentSegmentNodes[0];
        const endOsmId = currentSegmentNodes[currentSegmentNodes.length - 1];

        const startNodeObj = rawNodes.get(startOsmId)!;
        const endNodeObj = rawNodes.get(endOsmId)!;

        const sourceNodeId = `N_OSM_${startOsmId}`;
        const targetNodeId = `N_OSM_${endOsmId}`;

        // Ensure both intersections exist in intersectionMap
        if (!intersectionMap.has(sourceNodeId)) {
          intersectionMap.set(sourceNodeId, {
            node_id: sourceNodeId,
            name: startNodeObj.tags?.name || `Junction ${startOsmId}`,
            latitude: Number(startNodeObj.lat.toFixed(6)),
            longitude: Number(startNodeObj.lon.toFixed(6)),
            elevation_m: 22.0,
            district: 'NTR',
          });
        }

        if (!intersectionMap.has(targetNodeId)) {
          intersectionMap.set(targetNodeId, {
            node_id: targetNodeId,
            name: endNodeObj.tags?.name || `Junction ${endOsmId}`,
            latitude: Number(endNodeObj.lat.toFixed(6)),
            longitude: Number(endNodeObj.lon.toFixed(6)),
            elevation_m: 22.0,
            district: 'NTR',
          });
        }

        // Build exact GeoJSON coordinates [lon, lat] along the curve
        const coords: [number, number][] = [];
        let segmentDistanceMeters = 0;

        for (let k = 0; k < currentSegmentNodes.length; k++) {
          const ptId = currentSegmentNodes[k];
          const pt = rawNodes.get(ptId);
          if (pt) {
            coords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]);
            if (k > 0) {
              const prevPt = rawNodes.get(currentSegmentNodes[k - 1]);
              if (prevPt) {
                segmentDistanceMeters += haversineMeters(prevPt.lat, prevPt.lon, pt.lat, pt.lon);
              }
            }
          }
        }

        totalGeometryPoints += coords.length;
        const distM = Math.max(10, Math.round(segmentDistanceMeters));
        const travelSec = Math.max(2, Math.round(distM / speedMps));
        const roadId = `R_OSM_${roadCounter++}`;

        processedRoads.push({
          road_id: roadId,
          road_name: roadBaseName,
          district: 'NTR',
          source_node: sourceNodeId,
          target_node: targetNodeId,
          start_lat: Number(startNodeObj.lat.toFixed(6)),
          start_lng: Number(startNodeObj.lon.toFixed(6)),
          end_lat: Number(endNodeObj.lat.toFixed(6)),
          end_lng: Number(endNodeObj.lon.toFixed(6)),
          distance_m: distM,
          travel_time_sec: travelSec,
          status: 'open',
          road_type: highway,
          coordinates: {
            type: 'LineString',
            coordinates: coords,
          },
        });

        // Reset segment starting from this junction node
        currentSegmentNodes = [nodeId];
      }
    }
  }

  const intersectionsList = Array.from(intersectionMap.values());

  console.log(`[Graph Builder] Successfully built ${intersectionsList.length} intersections and ${processedRoads.length} road edges.`);
  console.log(`[Graph Builder] Total preserved high-resolution geometry waypoints: ${totalGeometryPoints}`);

  return {
    metadata: {
      region: 'Vijayawada (NTR District)',
      generatedAt: new Date().toISOString(),
      totalIntersections: intersectionsList.length,
      totalRoads: processedRoads.length,
      totalGeometryPoints,
    },
    intersections: intersectionsList,
    roads: processedRoads,
  };
}

export async function generateAndSaveVijayawadaGraph() {
  console.log('[OSM Import] Starting complete Vijayawada OSM processing pipeline...');
  const osmData = await fetchVijayawadaOsmData();
  const graphData = buildVijayawadaGraphData(osmData);

  const outputPath = path.resolve(__dirname, '../../frontend/src/lib/routing/vijayawada_road_network.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(graphData, null, 2), 'utf-8');
  console.log(`[OSM Import] Saved bundled Vijayawada network to: ${outputPath}`);

  return graphData;
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('buildGraphData.ts')) {
  generateAndSaveVijayawadaGraph()
    .then((data) => {
      console.log(`Generated ${data.intersections.length} intersections and ${data.roads.length} roads.`);
    })
    .catch((err) => {
      console.error('Failed to build graph data:', err);
      process.exit(1);
    });
}

