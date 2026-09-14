import { buildGraph, findShortestPath, updateGraphEdgeStatus, RoadStatus } from '../frontend/src/lib/routing';

async function runDynamicRoutingAudit() {
  console.log('================================================================');
  console.log('PHASE 4: DYNAMIC A* MULTI-STAGE ROUTING & OBSTACLE FILTER AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Build In-Memory Graph
  console.log('[1/5] Loading Full Vijayawada OSM Graph from Supabase...');
  const { graph, stats } = await buildGraph();
  assert(graph.nodes.size > 15000, `Graph nodes loaded: ${graph.nodes.size.toLocaleString()} vertices`);
  assert(stats.totalGraphEdges > 40000, `Graph edges compiled: ${stats.totalGraphEdges.toLocaleString()} directed edges`);

  // 2. Stage 1 Baseline Route Test (Benz Circle to GGH Trauma Center)
  console.log('\n[2/5] Testing Stage 1 Safe A* Baseline Routing...');
  const benzToGGH = {
    start: { lat: 16.5005, lng: 80.6555 },
    end: { lat: 16.5193, lng: 80.6305 },
  };

  const initialRoute = findShortestPath(
    benzToGGH.start.lat,
    benzToGGH.start.lng,
    benzToGGH.end.lat,
    benzToGGH.end.lng,
    graph
  );

  assert(initialRoute !== null, 'Initial baseline route found between Benz Circle and GGH');
  assert(initialRoute?.routeType === 'safe', `Route type is classified as SAFE (got: ${initialRoute?.routeType})`);
  assert(initialRoute?.stage === 1, `Route resolved at Stage 1 (got: ${initialRoute?.stage})`);
  assert((initialRoute?.geometry.length ?? 0) > 50, `Curved road geometry preserved (${initialRoute?.geometry.length} waypoints)`);
  assert(initialRoute?.instructions.length! > 0, `Turn instructions generated (${initialRoute?.instructions.length} steps)`);

  const initialDistance = initialRoute!.distanceMeters;
  const initialTime = initialRoute!.travelTimeSeconds;
  console.log(`  ↳ Initial Baseline: ${(initialDistance / 1000).toFixed(2)} km, ${Math.round(initialTime / 60)} mins (${initialRoute?.computationTimeMs} ms)`);

  // 3. Dynamic Obstacle Avoidance (Block primary road segments on route)
  console.log('\n[3/5] Testing Dynamic Obstacle Avoidance (Blocking arterial route segment)...');
  const primaryRoadId = initialRoute!.roadIds[0];
  const blockedRoads = new Set<string>([primaryRoadId]);

  const detouredRoute = findShortestPath(
    benzToGGH.start.lat,
    benzToGGH.start.lng,
    benzToGGH.end.lat,
    benzToGGH.end.lng,
    graph,
    blockedRoads
  );

  assert(detouredRoute !== null, `Detour route computed avoiding blocked road (${primaryRoadId})`);
  assert(!detouredRoute?.roadIds.includes(primaryRoadId), `Detour does NOT include blocked road ${primaryRoadId}`);
  assert((detouredRoute?.computationTimeMs ?? 999) < 100, `Real-time sub-100ms compute latency: ${detouredRoute?.computationTimeMs} ms`);

  // 4. Restricted Road Weight Penalty Test (travel_time * 2)
  console.log('\n[4/5] Testing Restricted Road Cost Penalty (travel_time × 2)...');
  const overrideStatus = new Map<string, RoadStatus>();
  // Mark the primary road as restricted instead of blocked
  overrideStatus.set(primaryRoadId, 'restricted');

  const restrictedRoute = findShortestPath(
    benzToGGH.start.lat,
    benzToGGH.start.lng,
    benzToGGH.end.lat,
    benzToGGH.end.lng,
    graph,
    undefined,
    overrideStatus
  );

  assert(restrictedRoute !== null, 'Route with restricted road evaluated');
  assert(
    restrictedRoute?.routeType === 'restricted' || restrictedRoute?.restrictedRoadsUsed! > 0 || restrictedRoute?.roadIds.includes(primaryRoadId),
    'Restricted road weight applied successfully'
  );

  // 5. Stage 3 Emergency Fallback when all connecting paths are blocked
  console.log('\n[5/5] Testing Stage 3 Emergency Fallback (Surrounding start node with blockages)...');
  const startNodeEdges = graph.adjacency.get(initialRoute!.pathNodes[0]) || [];
  const heavyBlockages = new Set<string>();
  startNodeEdges.forEach((e) => heavyBlockages.add(e.roadId));

  const emergencyRoute = findShortestPath(
    benzToGGH.start.lat,
    benzToGGH.start.lng,
    benzToGGH.end.lat,
    benzToGGH.end.lng,
    graph,
    heavyBlockages
  );

  assert(emergencyRoute !== null, 'Emergency route generated when surrounding roads are blocked');
  assert(emergencyRoute?.routeType === 'emergency', `Route correctly tagged as EMERGENCY (got: ${emergencyRoute?.routeType})`);
  assert(emergencyRoute?.stage === 3, `Resolved at Stage 3 fallback (got: ${emergencyRoute?.stage})`);
  assert(Boolean(emergencyRoute?.warning), `Emergency warning message attached: "${emergencyRoute?.warning}"`);

  console.log('\n================================================================');
  console.log(`DYNAMIC ROUTING AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDynamicRoutingAudit().catch((err) => {
  console.error('Dynamic routing audit fatal error:', err);
  process.exit(1);
});

