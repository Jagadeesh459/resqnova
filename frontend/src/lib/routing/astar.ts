import { Graph, GraphNode, GraphEdge, RouteResult, RouteStep } from './types';
import { haversineDistance, findNearestNode } from './utils';
import { PriorityQueue } from './priorityQueue';

// Maximum urban speed in Vijayawada (60 km/h = 16.67 m/s) to ensure admissible A* heuristic
const MAX_URBAN_SPEED_MPS = 16.67;

/**
 * Admissible heuristic estimating remaining travel time in seconds
 */
function heuristicTravelTime(from: GraphNode, to: GraphNode): number {
  const straightDistanceMeters = haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  return straightDistanceMeters / MAX_URBAN_SPEED_MPS;
}

/**
 * Production A* Shortest-Path Navigation Engine
 * Finds the optimal route between any two GPS coordinates or Graph Node IDs in Vijayawada.
 * - Uses PriorityQueue for O(E log V) search efficiency
 * - Snaps GPS to nearest graph nodes
 * - Admissible Haversine-based heuristic
 * - Concatenates full GeoJSON road geometry curves (no fake straight air-lines)
 * - Returns distance, ETA, visited nodes count, and execution latency
 */
export function findShortestPath(
  startLatOrNodeId: number | string,
  startLngOrEndLat: number | string,
  endLatOrEndLng?: number,
  endLngOrGraph?: number | Graph,
  maybeGraph?: Graph
): RouteResult | null {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  let startLat: number;
  let startLng: number;
  let endLat: number;
  let endLng: number;
  let graph: Graph;

  // Support flexible argument signatures:
  // Signature 1: findShortestPath(startLat, startLng, endLat, endLng, graph)
  // Signature 2: findShortestPath(startNodeId, endNodeId, graph)
  if (typeof startLatOrNodeId === 'number' && typeof startLngOrEndLat === 'number') {
    startLat = startLatOrNodeId;
    startLng = startLngOrEndLat;
    endLat = endLatOrEndLng as number;
    endLng = endLngOrGraph as number;
    graph = maybeGraph as Graph;
  } else if (typeof startLatOrNodeId === 'string' && typeof startLngOrEndLat === 'string') {
    graph = endLatOrEndLng as unknown as Graph;
    const sNode = graph?.nodes.get(startLatOrNodeId);
    const eNode = graph?.nodes.get(startLngOrEndLat);
    if (!sNode || !eNode) return null;
    startLat = sNode.latitude;
    startLng = sNode.longitude;
    endLat = eNode.latitude;
    endLng = eNode.longitude;
  } else {
    return null;
  }

  if (!graph || !graph.nodes || !graph.adjacency) {
    console.warn('[A* Engine] Invalid graph provided to findShortestPath');
    return null;
  }

  // 1. GPS Snapping to Nearest Road Intersection Node
  const startNodeId = findNearestNode(graph.nodes, startLat, startLng);
  const targetNodeId = findNearestNode(graph.nodes, endLat, endLng);

  if (!startNodeId || !targetNodeId) {
    console.warn('[A* Engine] Could not snap GPS coordinates to nearest graph nodes');
    return null;
  }

  const startNode = graph.nodes.get(startNodeId);
  const targetNode = graph.nodes.get(targetNodeId);

  if (!startNode || !targetNode) {
    return null;
  }

  // Trivial Case: Start and Target are identical
  if (startNodeId === targetNodeId) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      pathNodes: [startNodeId],
      roadIds: [],
      geometry: [[startNode.latitude, startNode.longitude]],
      distanceMeters: 0,
      travelTimeSeconds: 0,
      visitedNodes: [startNodeId],
      computationTimeMs: Math.round(elapsed * 100) / 100,
      startNode,
      targetNode,
      stepSegments: [],
    };
  }

  // 2. A* Search Data Structures
  const openSet = new PriorityQueue<string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, { prevNode: string; edge: GraphEdge }>();
  const closedSet = new Set<string>();
  const visitedNodes: string[] = [];

  // Initialize start node
  gScore.set(startNodeId, 0);
  const initialF = heuristicTravelTime(startNode, targetNode);
  fScore.set(startNodeId, initialF);
  openSet.enqueue(startNodeId, initialF);

  // 3. A* Search Loop
  while (!openSet.isEmpty()) {
    const currentId = openSet.dequeue()!;

    // Reached Destination!
    if (currentId === targetNodeId) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
      return reconstructRoute(
        startNode,
        targetNode,
        cameFrom,
        visitedNodes,
        Math.round(elapsed * 100) / 100
      );
    }

    if (closedSet.has(currentId)) continue;
    closedSet.add(currentId);
    visitedNodes.push(currentId);

    const currentNode = graph.nodes.get(currentId);
    if (!currentNode) continue;

    const currentG = gScore.get(currentId) ?? Infinity;
    const outgoingEdges = graph.adjacency.get(currentId) || [];

    for (const edge of outgoingEdges) {
      const neighborId = edge.to;
      if (closedSet.has(neighborId)) continue;

      const neighborNode = graph.nodes.get(neighborId);
      if (!neighborNode) continue;

      // Accumulated Travel Time Cost
      const tentativeG = currentG + edge.travelTime;
      const existingG = gScore.get(neighborId) ?? Infinity;

      if (tentativeG < existingG) {
        cameFrom.set(neighborId, { prevNode: currentId, edge });
        gScore.set(neighborId, tentativeG);

        const h = heuristicTravelTime(neighborNode, targetNode);
        const f = tentativeG + h;
        fScore.set(neighborId, f);

        openSet.enqueue(neighborId, f);
      }
    }
  }

  // No path found (target disconnected or isolated by flood blockages)
  console.warn(`[A* Engine] No path found between ${startNodeId} and ${targetNodeId}`);
  return null;
}

/**
 * Reconstructs complete route with full road geometry curves
 */
function reconstructRoute(
  startNode: GraphNode,
  targetNode: GraphNode,
  cameFrom: Map<string, { prevNode: string; edge: GraphEdge }>,
  visitedNodes: string[],
  computationTimeMs: number
): RouteResult {
  const pathNodes: string[] = [];
  const roadIds: string[] = [];
  const stepsReversed: RouteStep[] = [];
  const geometryReversed: [number, number][][] = [];

  let currId = targetNode.id;
  let totalDist = 0;
  let totalTime = 0;

  while (currId !== startNode.id) {
    pathNodes.unshift(currId);
    const step = cameFrom.get(currId);
    if (!step) break;

    const edge = step.edge;
    roadIds.unshift(edge.roadId);
    totalDist += edge.distance;
    totalTime += edge.travelTime;

    stepsReversed.push({
      roadId: edge.roadId,
      roadName: edge.roadName || edge.roadId,
      distanceMeters: edge.distance,
      travelTimeSeconds: edge.travelTime,
      from: edge.from,
      to: edge.to,
      geometry: edge.geometry,
    });

    geometryReversed.push(edge.geometry);
    currId = step.prevNode;
  }

  pathNodes.unshift(startNode.id);
  const stepSegments = stepsReversed.reverse();

  // Concatenate full high-resolution road geometry
  const fullGeometry: [number, number][] = [];
  const orderedGeometries = geometryReversed.reverse();

  for (let i = 0; i < orderedGeometries.length; i++) {
    const geom = orderedGeometries[i];
    for (let j = 0; j < geom.length; j++) {
      // Avoid duplicate overlapping connecting points
      if (
        fullGeometry.length > 0 &&
        fullGeometry[fullGeometry.length - 1][0] === geom[j][0] &&
        fullGeometry[fullGeometry.length - 1][1] === geom[j][1]
      ) {
        continue;
      }
      fullGeometry.push(geom[j]);
    }
  }

  // Fallback to start and target coordinates if geometry was empty
  if (fullGeometry.length === 0) {
    fullGeometry.push([startNode.latitude, startNode.longitude]);
    fullGeometry.push([targetNode.latitude, targetNode.longitude]);
  }

  return {
    pathNodes,
    roadIds,
    geometry: fullGeometry,
    distanceMeters: Math.round(totalDist),
    travelTimeSeconds: Math.round(totalTime),
    visitedNodes,
    computationTimeMs,
    startNode,
    targetNode,
    stepSegments,
  };
}

