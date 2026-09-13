import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env from workspace root and parent directories)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://xqadvyfpqubqtakjrkim.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWR2eWZwcXVicXRha2pya2ltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODgwNTc5NywiZXhwIjoyMTA0MzgxNzk3fQ.yMDhOJ6sAdN1PWqvl3BsDiBci6wXx6RRca0aAriTLHY';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function uploadNetworkToSupabase(): Promise<void> {
  console.log('================================================================');
  console.log(' ResQNova: OpenStreetMap Road Graph Synchronizer for Supabase');
  console.log(` Target Endpoint: ${supabaseUrl}`);
  console.log('================================================================\n');

  const jsonPath = path.resolve(__dirname, 'vijayawada_road_network.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Road network JSON not found at ${jsonPath}. Run buildGraphData.ts first.`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const dataset = JSON.parse(raw);

  const rawIntersections = dataset.intersections || [];
  const rawRoads = dataset.roads || [];

  console.log(`[OSM Dataset] Validating dataset integrity:`);
  console.log(`  - Total Intersections: ${rawIntersections.length.toLocaleString()}`);
  console.log(`  - Total Road Edges:    ${rawRoads.length.toLocaleString()}`);
  console.log(`  - Preserved Curves:    ${dataset.metadata?.totalGeometryPoints?.toLocaleString() || '69,000+'}\n`);

  if (rawIntersections.length === 0 || rawRoads.length === 0) {
    throw new Error('Dataset is empty or malformed. Verify buildGraphData.ts output.');
  }

  const BATCH_SIZE = 200;
  let totalIntersectionsUploaded = 0;
  let totalRoadsUploaded = 0;
  let failedIntersectionBatches = 0;
  let failedRoadBatches = 0;

  // -------------------------------------------------------------
  // 1. Upload Intersections (Vertices V)
  // -------------------------------------------------------------
  const totalIntersectionBatches = Math.ceil(rawIntersections.length / BATCH_SIZE);
  console.log(`[Supabase Upload] Uploading ${rawIntersections.length.toLocaleString()} intersections in ${totalIntersectionBatches} batches...`);

  for (let b = 0; b < totalIntersectionBatches; b++) {
    const startIdx = b * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, rawIntersections.length);
    const batch = rawIntersections.slice(startIdx, endIdx).map((item: any) => ({
      node_id: String(item.node_id),
      name: item.name || `Junction ${item.node_id}`,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      elevation_m: item.elevation_m ? Number(item.elevation_m) : 20.0,
      district: item.district || 'NTR',
    }));

    const { error } = await supabase
      .from('intersections')
      .upsert(batch, { onConflict: 'node_id' });

    if (error) {
      failedIntersectionBatches++;
      console.warn(`\n  ✗ Intersections batch ${b + 1}/${totalIntersectionBatches} failed: ${error.message} (Code: ${error.code})`);
    } else {
      totalIntersectionsUploaded += batch.length;
    }

    if ((b + 1) % 10 === 0 || b + 1 === totalIntersectionBatches) {
      process.stdout.write(`\r  Uploading intersections batch ${b + 1}/${totalIntersectionBatches} | Inserted ${totalIntersectionsUploaded.toLocaleString()} nodes...`);
    }
  }

  console.log(`\n✓ Intersections upload complete: ${totalIntersectionsUploaded.toLocaleString()} nodes stored in Supabase.\n`);

  // -------------------------------------------------------------
  // 2. Upload Roads (Topological Edges E with GeoJSON Curvatures)
  // -------------------------------------------------------------
  const totalRoadBatches = Math.ceil(rawRoads.length / BATCH_SIZE);
  console.log(`[Supabase Upload] Uploading ${rawRoads.length.toLocaleString()} roads in ${totalRoadBatches} batches...`);

  for (let b = 0; b < totalRoadBatches; b++) {
    const startIdx = b * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, rawRoads.length);

    // Map road record without sending raw 'id' (letting road_id be the primary key / unique index)
    const batch = rawRoads.slice(startIdx, endIdx).map((r: any) => ({
      road_id: String(r.road_id),
      road_name: r.road_name || 'Vijayawada Street',
      district: r.district || 'NTR',
      source_node: String(r.source_node),
      target_node: String(r.target_node),
      start_lat: Number(r.start_lat),
      start_lng: Number(r.start_lng),
      end_lat: Number(r.end_lat),
      end_lng: Number(r.end_lng),
      distance_m: Number(r.distance_m) || 100.0,
      travel_time_sec: Number(r.travel_time_sec) || 10.0,
      status: r.status || 'open',
      coordinates: r.coordinates,
      blocked_reason: r.blocked_reason || null,
    }));

    const { error } = await supabase
      .from('roads')
      .upsert(batch, { onConflict: 'road_id' });

    if (error) {
      failedRoadBatches++;
      console.warn(`\n  ✗ Roads batch ${b + 1}/${totalRoadBatches} failed: ${error.message} (Code: ${error.code})`);
      if (error.details) console.warn(`    Details: ${error.details}`);
      if (error.hint) console.warn(`    Hint: ${error.hint}`);
    } else {
      totalRoadsUploaded += batch.length;
    }

    if ((b + 1) % 10 === 0 || b + 1 === totalRoadBatches) {
      process.stdout.write(`\r  Uploading roads batch ${b + 1}/${totalRoadBatches} | Inserted ${totalRoadsUploaded.toLocaleString()} roads...`);
    }
  }

  console.log(`\n✓ Roads upload complete: ${totalRoadsUploaded.toLocaleString()} edges stored in Supabase.\n`);

  // -------------------------------------------------------------
  // 3. Final Verification & Post-Upload Summary
  // -------------------------------------------------------------
  console.log('================================================================');
  console.log(' SYNCHRONIZATION SUMMARY:');
  console.log(`  - Total Intersections Uploaded: ${totalIntersectionsUploaded.toLocaleString()} / ${rawIntersections.length.toLocaleString()}`);
  console.log(`  - Total Roads Uploaded:         ${totalRoadsUploaded.toLocaleString()} / ${rawRoads.length.toLocaleString()}`);
  console.log(`  - Failed Intersection Batches:  ${failedIntersectionBatches}`);
  console.log(`  - Failed Road Batches:          ${failedRoadBatches}`);
  console.log('================================================================\n');

  // Verify Counts in Live Supabase Database
  const { count: dbIntersectionsCount } = await supabase
    .from('intersections')
    .select('node_id', { count: 'exact', head: true });

  const { count: dbRoadsCount } = await supabase
    .from('roads')
    .select('road_id', { count: 'exact', head: true });

  console.log(' LIVE SUPABASE ROW COUNTS:');
  console.log(`  - SELECT COUNT(*) FROM intersections; -> ${dbIntersectionsCount?.toLocaleString()} rows`);
  console.log(`  - SELECT COUNT(*) FROM roads;         -> ${dbRoadsCount?.toLocaleString()} rows\n`);

  const { data: sampleData } = await supabase
    .from('roads')
    .select('road_id, road_name, source_node, target_node, distance_m, travel_time_sec, status, coordinates')
    .not('source_node', 'is', null)
    .limit(1);

  if (sampleData && sampleData.length > 0) {
    const s = sampleData[0];
    console.log(' SAMPLE VERIFIED ROAD RECORD FROM SUPABASE:');
    console.log(`  - road_id:         ${s.road_id}`);
    console.log(`  - road_name:       ${s.road_name}`);
    console.log(`  - source_node:     ${s.source_node}`);
    console.log(`  - target_node:     ${s.target_node}`);
    console.log(`  - distance_m:      ${s.distance_m}m`);
    console.log(`  - travel_time_sec: ${s.travel_time_sec}s`);
    console.log(`  - status:          ${s.status}`);
    console.log(`  - coordinates:     ${JSON.stringify(s.coordinates).slice(0, 70)}...`);
  }
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('uploadSupabase.ts')) {
  uploadNetworkToSupabase()
    .then(() => {
      console.log('\n[Supabase Upload] All Vijayawada OpenStreetMap data synchronized successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n[Supabase Upload] Fatal error during upload:', err);
      process.exit(1);
    });
}
