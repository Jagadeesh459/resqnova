import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqadvyfpqubqtakjrkim.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWR2eWZwcXVicXRha2pya2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDU3OTcsImV4cCI6MjEwNDM4MTc5N30.r5ZrPnZCh2hJNODCPd6wkn5nx1NXSG4VS83xZa63FE8';

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_ROUTING_COLUMNS = [
  'road_id',
  'road_name',
  'district',
  'source_node',
  'target_node',
  'start_lat',
  'start_lng',
  'end_lat',
  'end_lng',
  'distance_m',
  'travel_time_sec',
  'status',
  'coordinates',
  'updated_at',
];

export async function verifyRoutingSchema(): Promise<boolean> {
  console.log('================================================================');
  console.log(' ResQNova: Supabase Routing Schema & Topology Verifier');
  console.log(` Target Endpoint: ${supabaseUrl}`);
  console.log('================================================================\n');

  let allPassed = true;

  // 1. Verify Intersections Table
  let intersectionsCount = 0;
  try {
    const { data, count, error } = await supabase
      .from('intersections')
      .select('node_id, latitude, longitude, name', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`✗ intersections table check failed: ${error.message}`);
      allPassed = false;
    } else {
      intersectionsCount = count ?? (data ? data.length : 0);
      console.log(`✓ intersections table found (Rows: ${intersectionsCount.toLocaleString()})`);
    }
  } catch (err: any) {
    console.log(`✗ intersections table check exception: ${err?.message}`);
    allPassed = false;
  }

  // 2. Verify Roads Table and Columns
  let roadsCount = 0;
  try {
    const { data, count, error } = await supabase
      .from('roads')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`✗ roads table check failed: ${error.message}`);
      allPassed = false;
    } else {
      roadsCount = count ?? (data ? data.length : 0);
      console.log(`✓ roads table found (Rows: ${roadsCount.toLocaleString()})`);

      // Test individual columns on a sample row or select
      const sampleRow = data && data.length > 0 ? data[0] : null;

      for (const col of REQUIRED_ROUTING_COLUMNS) {
        try {
          const { error: colError } = await supabase
            .from('roads')
            .select(col)
            .limit(1);

          if (colError) {
            console.log(`  ✗ column missing: "${col}" (${colError.message})`);
            allPassed = false;
          } else {
            console.log(`  ✓ column verified: "${col}"`);
          }
        } catch {
          console.log(`  ✗ column check failed: "${col}"`);
          allPassed = false;
        }
      }

      if (sampleRow) {
        console.log('\n  Sample Road Topology Record:');
        console.log(`    - road_id:         ${sampleRow.road_id || sampleRow.id}`);
        console.log(`    - road_name:       ${sampleRow.road_name || sampleRow.name}`);
        console.log(`    - source_node:     ${sampleRow.source_node || 'N/A'}`);
        console.log(`    - target_node:     ${sampleRow.target_node || 'N/A'}`);
        console.log(`    - distance_m:      ${sampleRow.distance_m || sampleRow.distance_km ? `${sampleRow.distance_m ?? sampleRow.distance_km * 1000}m` : 'N/A'}`);
        console.log(`    - travel_time_sec: ${sampleRow.travel_time_sec ?? 'N/A'}s`);
        console.log(`    - status:          ${sampleRow.status || 'open'}`);
        console.log(`    - coordinates:     ${sampleRow.coordinates ? (typeof sampleRow.coordinates === 'object' ? 'Valid GeoJSON' : 'Present') : 'None'}`);
      }
    }
  } catch (err: any) {
    console.log(`✗ roads table check exception: ${err?.message}`);
    allPassed = false;
  }

  // 3. Overall Verdict
  console.log('\n================================================================');
  if (allPassed) {
    console.log(' VERDICT: ALL ROUTING SCHEMA CHECKS PASSED (✓ READY FOR A* & D* LITE)');
  } else {
    console.log(' VERDICT: MIGRATION NEEDED IN SUPABASE SQL EDITOR');
    console.log(' Please execute database/migration_routing_upgrade.sql in your Supabase Dashboard.');
  }
  console.log('================================================================\n');

  return allPassed;
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('verifyRoutingSchema.ts')) {
  verifyRoutingSchema()
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Verification script failed:', err);
      process.exit(1);
    });
}

