import { Graph, GraphNode, GraphEdge, RouteResult, RouteStep, TurnInstruction, ManeuverType } from './types';
import { haversineDistance, findNearestNode, calculateBearing } from './utils';
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
 * Generates natural Google Maps-style turn-by-turn maneuvers from traversed road segments
 */
function generateTurnInstructions(
  steps: RouteStep[],
  startNode: GraphNode,
  targetNode: GraphNode
): TurnInstruction[] {
  if (steps.length === 0) {
    return [
      {
        instruction: `Arrive at ${targetNode.name || 'destination'}`,
        maneuver: 'arrive',
        roadName: 'Destination',
        distanceMeters: 0,
        travelTimeSeconds: 0,
      },
    ];
  }

  const instructions: TurnInstruction[] = [];

  // Group steps by road name or major turn changes
  let currentGroup = {
    roadName: steps[0].roadName,
    distanceMeters: steps[0].distanceMeters,
    travelTimeSeconds: steps[0].travelTimeSeconds,
    maneuver: 'depart' as ManeuverType,
  };

  instructions.push({
    instruction: `Head on ${steps[0].roadName} toward ${steps[0].to}`,
    maneuver: 'depart',
    roadName: steps[0].roadName,
    distanceMeters: steps[0].distanceMeters,
    travelTimeSeconds: steps[0].travelTimeSeconds,
  });

  for (let i = 1; i < steps.length; i++) {
    const prevStep = steps[i - 1];
    const currStep = steps[i];

    // Compute bearing change
    const p1 = prevStep.geometry[Math.max(0, prevStep.geometry.length - 2)] || [prevStep.geometry[0][0], prevStep.geometry[0][1]];
    const p2 = prevStep.geometry[prevStep.geometry.length - 1];
    const p3 = currStep.geometry[Math.min(1, currStep.geometry.length - 1)];

    const b1 = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
    const b2 = calculateBearing(p2[0], p2[1], p3[0], p3[1]);

    let diff = b2 - b1;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    let maneuver: ManeuverType = 'straight';
    if (diff > 45 && diff <= 135) maneuver = 'turn-right';
    else if (diff > 15 && diff <= 45) maneuver = 'slight-right';
    else if (diff < -45 && diff >= -135) maneuver = 'turn-left';
    else if (diff < -15 && diff >= -45) maneuver = 'slight-left';
    else if (Math.abs(diff) > 135) maneuver = 'u-turn';

    const isSameRoad = currStep.roadName === prevStep.roadName;
    const formattedDist = currStep.distanceMeters >= 1000
      ? `${(currStep.distanceMeters / 1000).toFixed(1)} km`
      : `${currStep.distanceMeters} m`;

    if (maneuver === 'turn-right') {
      instructions.push({
        instruction: `Turn right onto ${currStep.roadName} and continue for ${formattedDist}`,
        maneuver: 'turn-right',
        roadName: currStep.roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'turn-left') {
      instructions.push({
        instruction: `Turn left onto ${currStep.roadName} and continue for ${formattedDist}`,
        maneuver: 'turn-left',
        roadName: currStep.roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'slight-right') {
      instructions.push({
        instruction: `Keep right onto ${currStep.roadName} (${formattedDist})`,
        maneuver: 'slight-right',
        roadName: currStep.roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'slight-left') {
      instructions.push({
        instruction: `Keep left onto ${currStep.roadName} (${formattedDist})`,
        maneuver: 'slight-left',
        roadName: currStep.roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (!isSameRoad) {
      instructions.push({
        instruction: `Continue straight onto ${currStep.roadName} for ${formattedDist}`,
        maneuver: 'straight',
        roadName: currStep.roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    }
  }

  instructions.push({
    instruction: `Arrive at destination (${targetNode.name || 'Target Location'})`,
    maneuver: 'arrive',
    roadName: steps[steps.length - 1]?.roadName || 'Destination',
    distanceMeters: 0,
    travelTimeSeconds: 0,
  });

  return instructions;
}

/**
 * Production A* Shortest-Path Navigation Engine
 * Finds the optimal route between any two GPS coordinates or Graph Node IDs in Vijayawada.
 * - Uses PriorityQueue for O(E log V) search efficiency
 * - Snaps GPS to nearest graph nodes
 * - Admissible Haversine-based heuristic
 * - Concatenates full GeoJSON road geometry curves (no fake straight air-lines)
 * - Returns distance, ETA, turn-by-turn instructions, and execution latency
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
      instructions: [
        {
          instruction: `You are already at ${targetNode.name || 'destination'}`,
          maneuver: 'arrive',
          roadName: 'Location',
          distanceMeters: 0,
          travelTimeSeconds: 0,
        },
      ],
      startingRoadName: 'Current Location',
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
 * Reconstructs complete route with full road geometry curves and turn-by-turn guidance
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

  const instructions = generateTurnInstructions(stepSegments, startNode, targetNode);
  const startingRoadName = stepSegments[0]?.roadName || 'Vijayawada Corridor';

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
    instructions,
    startingRoadName,
  };
}
