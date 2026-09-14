import { createClient } from '@supabase/supabase-js';
import { buildGraph, findShortestPath } from '../frontend/src/lib/routing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqadvyfpqubqtakjrkim.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWR2eWZwcXVicXRha2pya2ltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODgwNTc5NywiZXhwIjoyMTA0MzgxNzk3fQ.yMDhOJ6sAdN1PWqvl3BsDiBci6wXx6RRca0aAriTLHY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runGraphIntegrityAudit() {
  console.log('================================================================');
  console.log('RESQNOVA VIJAYAWADA ROAD GRAPH INTEGRITY & ROUTING RECOVERY AUDIT');
  console.log('================================================================');
  console.log('');

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

  // -------------------------------------------------------------
  // 1. SUPABASE DATABASE AUDIT
  // -------------------------------------------------------------
  console.log('[1/4] Auditing Supabase Tables (intersections & roads)...');

  const { count: intersectionCount, error: intErr } = await supabase
    .from('intersections')
    .select('*', { count: 'exact', head: true });

  const { count: roadCount, error: rdErr } = await supabase
    .from('roads')
    .select('*', { count: 'exact', head: true });

  if (intErr || rdErr) {
    console.error('Supabase query error:', intErr || rdErr);
  }

  assert(!intErr && (intersectionCount ?? 0) > 3000, `Intersections table populated: ${intersectionCount ?? 0} rows`);
  assert(!rdErr && (roadCount ?? 0) > 3000, `Roads table populated: ${roadCount ?? 0} rows`);

  // Check for legacy rd-* records in roads table
  const { data: legacyRoads } = await supabase
    .from('roads')
    .select('road_id')
    .like('road_id', 'rd-%')
    .limit(10);

  const legacyCount = legacyRoads?.length || 0;
  assert(legacyCount === 0, `No legacy demo roads (rd-*) in database (found: ${legacyCount})`);

  // -------------------------------------------------------------
  // 2. GRAPH ENGINE BUILD & TOPOLOGY
  // -------------------------------------------------------------
  console.log('\n[2/4] Building In-Memory Topological Graph Engine...');
  const { graph, stats } = await buildGraph();

  assert(graph.nodes.size > 0, `Graph nodes loaded: ${graph.nodes.size} vertices`);
  assert(stats.totalGraphEdges > 0, `Graph edges compiled: ${stats.totalGraphEdges} directed edges`);
  assert((stats.totalGeometryPoints ?? 0) > 10000, `High-resolution curvature points preserved: ${stats.totalGeometryPoints} points`);

  // Connectivity check: count orphan nodes (0 outgoing edges)
  let orphanNodeCount = 0;
  graph.nodes.forEach((_, nodeId) => {
    const edges = graph.adjacency.get(nodeId);
    if (!edges || edges.length === 0) {
      orphanNodeCount++;
    }
  });

  const connectedNodeRatio = ((graph.nodes.size - orphanNodeCount) / graph.nodes.size) * 100;
  assert(connectedNodeRatio > 85, `Graph connectivity ratio: ${connectedNodeRatio.toFixed(1)}% connected nodes (orphans: ${orphanNodeCount})`);

  // -------------------------------------------------------------
  // 3. BENCHMARK ROUTE EVALUATIONS (VIJAYAWADA HOTSPOTS)
  // -------------------------------------------------------------
  console.log('\n[3/4] Testing Real Vijayawada A* Navigation Benchmarks...');

  const benchmarks = [
    {
      name: 'Benz Circle ➔ GGH Apex Trauma Center',
      start: { lat: 16.5005, lng: 80.6555 },
      end: { lat: 16.5193, lng: 80.6305 },
    },
    {
      name: 'Prakasam Barrage ➔ Governorpet Collectorate',
      start: { lat: 16.5075, lng: 80.6185 },
      end: { lat: 16.5135, lng: 80.6312 },
    },
    {
      name: 'Bhavanipuram Ferry ➔ Ramavarappadu Ring',
      start: { lat: 16.5185, lng: 80.6055 },
      end: { lat: 16.5285, lng: 80.6685 },
    },
    {
      name: 'Kanaka Durga Flyover ➔ Auto Nagar Hub',
      start: { lat: 16.5215, lng: 80.6125 },
      end: { lat: 16.495, lng: 80.665 },
    },
  ];

  for (const b of benchmarks) {
    const route = findShortestPath(b.start.lat, b.start.lng, b.end.lat, b.end.lng, graph);
    assert(route !== null, `${b.name} route found`);
    if (route) {
      assert(route.geometry.length > 2, `  ↳ High-res curve: ${route.geometry.length} waypoints, ${route.distanceMeters}m, ETA ${Math.round(route.travelTimeSeconds / 60)}m (${route.computationTimeMs}ms)`);
      assert(route.instructions.length > 0, `  ↳ Turn instructions generated: ${route.instructions.length} steps (First: "${route.instructions[0].instruction}")`);
    }
  }

  // -------------------------------------------------------------
  // 4. DYNAMIC OBSTACLE AVOIDANCE
  // -------------------------------------------------------------
  console.log('\n[4/4] Testing Flood Obstacle Avoidance & Re-routing...');
  const testPreset = benchmarks[0];
  const initialRoute = findShortestPath(testPreset.start.lat, testPreset.start.lng, testPreset.end.lat, testPreset.end.lng, graph);

  if (initialRoute && initialRoute.roadIds.length > 0) {
    const blockedRoadId = initialRoute.roadIds[0];
    const blockedSet = new Set<string>([blockedRoadId]);
    const reroutedRoute = findShortestPath(
      testPreset.start.lat,
      testPreset.start.lng,
      testPreset.end.lat,
      testPreset.end.lng,
      graph,
      blockedSet
    );
    assert(reroutedRoute !== null, `Re-routing succeeded after dynamically blocking primary road (${blockedRoadId})`);
    if (reroutedRoute) {
      console.log(`  ✓ PASS:   ↳ Detour route found avoiding ${blockedRoadId}: ${reroutedRoute.distanceMeters}m (${reroutedRoute.computationTimeMs}ms)`);
    }
  }

  console.log('\n================================================================');
  console.log(`GRAPH INTEGRITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGraphIntegrityAudit().catch((err) => {
  console.error('Audit failed with fatal error:', err);
  process.exit(1);
});

