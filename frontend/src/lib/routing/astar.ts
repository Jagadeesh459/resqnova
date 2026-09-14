import {
  Graph,
  GraphNode,
  GraphEdge,
  RouteResult,
  RouteStep,
  TurnInstruction,
  ManeuverType,
  RoadStatus,
} from './types';
import { haversineDistance, findNearestNodeWithDistance, calculateBearing } from './utils';
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
 * Formats road distance for natural turn instructions
 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Clean road display name
 */
function cleanRoadName(rawName?: string, roadId?: string): string {
  if (!rawName || rawName.trim() === '') {
    return roadId ? `Road Segment ${roadId.replace('_rev', '')}` : 'Connecting Street';
  }
  let name = rawName.trim();
  // If it's a generic internal tag like "Vijayawada residential route", simplify or keep natural
  return name;
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
  const firstRoad = cleanRoadName(steps[0].roadName, steps[0].roadId);
  const firstDist = formatDistance(steps[0].distanceMeters);

  instructions.push({
    instruction: `Head on ${firstRoad} for ${firstDist}`,
    maneuver: 'depart',
    roadName: firstRoad,
    distanceMeters: steps[0].distanceMeters,
    travelTimeSeconds: steps[0].travelTimeSeconds,
  });

  for (let i = 1; i < steps.length; i++) {
    const prevStep = steps[i - 1];
    const currStep = steps[i];
    const roadName = cleanRoadName(currStep.roadName, currStep.roadId);
    const prevRoad = cleanRoadName(prevStep.roadName, prevStep.roadId);

    // Compute bearing change between connected segments
    const p1 =
      prevStep.geometry[Math.max(0, prevStep.geometry.length - 2)] || [
        prevStep.geometry[0][0],
        prevStep.geometry[0][1],
      ];
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

    const isSameRoad = roadName === prevRoad;
    const formattedDist = formatDistance(currStep.distanceMeters);

    if (maneuver === 'turn-right') {
      instructions.push({
        instruction: `Turn right onto ${roadName} and continue for ${formattedDist}`,
        maneuver: 'turn-right',
        roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'turn-left') {
      instructions.push({
        instruction: `Turn left onto ${roadName} and continue for ${formattedDist}`,
        maneuver: 'turn-left',
        roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'slight-right') {
      instructions.push({
        instruction: `Keep right onto ${roadName} (${formattedDist})`,
        maneuver: 'slight-right',
        roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'slight-left') {
      instructions.push({
        instruction: `Keep left onto ${roadName} (${formattedDist})`,
        maneuver: 'slight-left',
        roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (maneuver === 'u-turn') {
      instructions.push({
        instruction: `Make a U-turn onto ${roadName} (${formattedDist})`,
        maneuver: 'u-turn',
        roadName,
        distanceMeters: currStep.distanceMeters,
        travelTimeSeconds: currStep.travelTimeSeconds,
      });
    } else if (!isSameRoad) {
      instructions.push({
        instruction: `Continue straight onto ${roadName} for ${formattedDist}`,
        maneuver: 'straight',
        roadName,
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
 * Phase 4 Dynamic Multi-Stage A* Shortest-Path Routing Engine
 * - Evaluates edge statuses (open, restricted, blocked, flooded) dynamically
 * - Multi-Stage Level 1: Safe routing (Strict open + restricted penalty)
 * - Multi-Stage Level 2: Relaxed restricted bypass
 * - Multi-Stage Level 3: Emergency fallback when road network is cut off (with warning)
 * - Real-time sub-50ms execution
 */
export function findShortestPath(
  startLatOrNodeId: number | string,
  startLngOrEndLat: number | string,
  endLatOrEndLng?: number,
  endLngOrGraph?: number | Graph,
  maybeGraph?: Graph,
  blockedRoadIds?: Set<string>,
  roadStatusOverrides?: Map<string, RoadStatus> | Record<string, RoadStatus>
): RouteResult | null {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  let startLat: number;
  let startLng: number;
  let endLat: number;
  let endLng: number;
  let graph: Graph;

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

  // Dynamic road status resolver helper
  const getEffectiveStatus = (edge: GraphEdge): RoadStatus => {
    const baseId = edge.roadId.replace(/_rev$/, '');
    if (blockedRoadIds && (blockedRoadIds.has(edge.roadId) || blockedRoadIds.has(baseId))) {
      return 'blocked';
    }
    if (roadStatusOverrides) {
      if (roadStatusOverrides instanceof Map) {
        const ov = roadStatusOverrides.get(edge.roadId) || roadStatusOverrides.get(baseId);
        if (ov) return ov;
      } else {
        const ov = roadStatusOverrides[edge.roadId] || roadStatusOverrides[baseId];
        if (ov) return ov;
      }
    }
    return edge.status || 'open';
  };

  // Node connectivity validator for snapping
  const hasConnectedEdges = (node: { id: string }) => (graph.adjacency.get(node.id)?.length ?? 0) > 0;

  // 1. GPS Snapping to Nearest Connected Road Node
  let startSnap = findNearestNodeWithDistance(
    graph.nodes,
    startLat,
    startLng,
    undefined,
    hasConnectedEdges,
    15000
  );
  let targetSnap = findNearestNodeWithDistance(
    graph.nodes,
    endLat,
    endLng,
    undefined,
    hasConnectedEdges,
    15000
  );

  if (!startSnap || !targetSnap) {
    console.warn('[A* Engine] Could not snap GPS coordinates to any connected graph nodes');
    return null;
  }

  const rawDistMeters = haversineDistance(startLat, startLng, endLat, endLng);

  // Resolve identical-node snapping for distinct points (>25m)
  if (startSnap.nodeId === targetSnap.nodeId && rawDistMeters > 25) {
    const alternateTargetSnap = findNearestNodeWithDistance(
      graph.nodes,
      endLat,
      endLng,
      startSnap.nodeId,
      hasConnectedEdges,
      10000
    );
    if (alternateTargetSnap) {
      targetSnap = alternateTargetSnap;
    }
  }

  const startNodeId = startSnap.nodeId;
  const targetNodeId = targetSnap.nodeId;

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
      startSnapDistanceMeters: startSnap.distanceMeters,
      targetSnapDistanceMeters: targetSnap.distanceMeters,
      routeType: 'safe',
      stage: 1,
      blockedRoadsAvoided: 0,
      restrictedRoadsUsed: 0,
    };
  }

  // -------------------------------------------------------------
  // MULTI-STAGE A* SOLVER
  // -------------------------------------------------------------
  function runSearchStage(stage: 1 | 2 | 3): {
    cameFrom: Map<string, { prevNode: string; edge: GraphEdge; effectiveStatus: RoadStatus }>;
    visitedNodes: string[];
    blockedAvoidedCount: number;
    restrictedUsedCount: number;
  } | null {
    const openSet = new PriorityQueue<string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<
      string,
      { prevNode: string; edge: GraphEdge; effectiveStatus: RoadStatus }
    >();
    const closedSet = new Set<string>();
    const visitedNodes: string[] = [];

    let blockedAvoidedCount = 0;
    let restrictedUsedCount = 0;

    gScore.set(startNodeId, 0);
    const initialF = heuristicTravelTime(startNode!, targetNode!);
    fScore.set(startNodeId, initialF);
    openSet.enqueue(startNodeId, initialF);

    while (!openSet.isEmpty()) {
      const currentId = openSet.dequeue()!;

      if (currentId === targetNodeId) {
        return { cameFrom, visitedNodes, blockedAvoidedCount, restrictedUsedCount };
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

        const status = getEffectiveStatus(edge);

        // EDGE WEIGHT CALCULATION BASED ON STATUS & STAGE
        let edgeCost: number;

        if (stage === 1) {
          // Stage 1: Safe routing. Blocked & Flooded forbidden.
          if (status === 'blocked' || status === 'flooded') {
            blockedAvoidedCount++;
            continue;
          }
          if (status === 'restricted') {
            edgeCost = edge.travelTime * 2.0; // travel_time * 2 penalty
            restrictedUsedCount++;
          } else {
            edgeCost = edge.travelTime;
          }
        } else if (stage === 2) {
          // Stage 2: Allow restricted roads with weight penalty, still avoid blocked & flooded
          if (status === 'blocked' || status === 'flooded') {
            blockedAvoidedCount++;
            continue;
          }
          edgeCost = status === 'restricted' ? edge.travelTime * 2.5 : edge.travelTime;
        } else {
          // Stage 3: Emergency Fallback when all safe routes are impossible
          if (status === 'flooded') {
            edgeCost = edge.travelTime * 25.0 + 1200; // heavily penalized
          } else if (status === 'blocked') {
            edgeCost = edge.travelTime * 15.0 + 600; // heavily penalized
          } else if (status === 'restricted') {
            edgeCost = edge.travelTime * 2.0;
          } else {
            edgeCost = edge.travelTime;
          }
        }

        const tentativeG = currentG + edgeCost;
        const existingG = gScore.get(neighborId) ?? Infinity;

        if (tentativeG < existingG) {
          cameFrom.set(neighborId, { prevNode: currentId, edge, effectiveStatus: status });
          gScore.set(neighborId, tentativeG);

          const h = heuristicTravelTime(neighborNode, targetNode!);
          const f = tentativeG + h;
          fScore.set(neighborId, f);

          openSet.enqueue(neighborId, f);
        }
      }
    }

    return null;
  }

  // Execute Stage 1 ➔ Stage 2 ➔ Stage 3
  let searchResult = runSearchStage(1);
  let resolvedStage: 1 | 2 | 3 = 1;

  if (!searchResult) {
    searchResult = runSearchStage(2);
    resolvedStage = 2;
  }

  if (!searchResult) {
    searchResult = runSearchStage(3);
    resolvedStage = 3;
  }

  if (!searchResult) {
    console.warn(`[A* Engine] Completely disconnected: no topological path exists between ${startNodeId} and ${targetNodeId}`);
    return null;
  }

  const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
  const computationTimeMs = Math.round(elapsed * 100) / 100;

  return reconstructRoute(
    startNode,
    targetNode,
    searchResult.cameFrom,
    searchResult.visitedNodes,
    computationTimeMs,
    resolvedStage,
    searchResult.blockedAvoidedCount,
    startSnap.distanceMeters,
    targetSnap.distanceMeters
  );
}

/**
 * Reconstructs complete route with full road geometry curves, maneuvers, and stage metadata
 */
function reconstructRoute(
  startNode: GraphNode,
  targetNode: GraphNode,
  cameFrom: Map<string, { prevNode: string; edge: GraphEdge; effectiveStatus: RoadStatus }>,
  visitedNodes: string[],
  computationTimeMs: number,
  stage: 1 | 2 | 3,
  blockedAvoidedCount: number,
  startSnapDistanceMeters?: number,
  targetSnapDistanceMeters?: number
): RouteResult {
  const pathNodes: string[] = [];
  const roadIds: string[] = [];
  const stepsReversed: RouteStep[] = [];
  const geometryReversed: [number, number][][] = [];

  let currId = targetNode.id;
  let totalDist = 0;
  let totalTime = 0;
  let restrictedUsedCount = 0;
  let hasBlockedEdge = false;

  while (currId !== startNode.id) {
    pathNodes.unshift(currId);
    const step = cameFrom.get(currId);
    if (!step) break;

    const edge = step.edge;
    const status = step.effectiveStatus;

    if (status === 'restricted') {
      restrictedUsedCount++;
    }
    if (status === 'blocked' || status === 'flooded') {
      hasBlockedEdge = true;
    }

    roadIds.unshift(edge.roadId);
    totalDist += edge.distance;
    totalTime += edge.travelTime;

    stepsReversed.push({
      roadId: edge.roadId,
      roadName: cleanRoadName(edge.roadName, edge.roadId),
      distanceMeters: edge.distance,
      travelTimeSeconds: edge.travelTime,
      from: edge.from,
      to: edge.to,
      geometry: edge.geometry,
      status,
    });

    geometryReversed.push(edge.geometry);
    currId = step.prevNode;
  }

  pathNodes.unshift(startNode.id);

  // Invert collected steps
  const stepSegments = stepsReversed.reverse();

  // Flatten and concatenate complete geometry
  const fullGeometry: [number, number][] = [];
  geometryReversed.reverse().forEach((segGeom) => {
    if (fullGeometry.length === 0) {
      fullGeometry.push(...segGeom);
    } else {
      // Avoid duplicate consecutive waypoint at intersection junction
      const lastPt = fullGeometry[fullGeometry.length - 1];
      const startPt = segGeom[0];
      if (lastPt && startPt && Math.abs(lastPt[0] - startPt[0]) < 1e-6 && Math.abs(lastPt[1] - startPt[1]) < 1e-6) {
        fullGeometry.push(...segGeom.slice(1));
      } else {
        fullGeometry.push(...segGeom);
      }
    }
  });

  const startingRoadName = stepSegments[0]?.roadName || 'Starting Road';
  const instructions = generateTurnInstructions(stepSegments, startNode, targetNode);

  // Classify route type
  let routeType: 'safe' | 'restricted' | 'emergency' = 'safe';
  let warning: string | undefined = undefined;

  if (stage === 3 || hasBlockedEdge) {
    routeType = 'emergency';
    warning = 'Safe routes unavailable. Emergency route crosses blocked/flooded roads.';
  } else if (stage === 2 || restrictedUsedCount > 0) {
    routeType = 'restricted';
    warning = 'Route utilizes restricted roads to bypass flood blockages.';
  }

  return {
    pathNodes,
    roadIds,
    geometry: fullGeometry,
    distanceMeters: totalDist,
    travelTimeSeconds: totalTime,
    visitedNodes,
    computationTimeMs,
    startNode,
    targetNode,
    stepSegments,
    instructions,
    startingRoadName,
    startSnapDistanceMeters,
    targetSnapDistanceMeters,
    routeType,
    stage,
    blockedRoadsAvoided: blockedAvoidedCount,
    restrictedRoadsUsed: restrictedUsedCount,
    warning,
    isEmergency: routeType === 'emergency',
  };
}
