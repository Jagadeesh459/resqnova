import fs from 'fs';
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

export async function uploadNetworkToSupabase(limitSegments?: number) {
  const jsonPath = path.resolve(__dirname, 'vijayawada_road_network.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Road network JSON not found at ${jsonPath}. Run buildGraphData.ts first.`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const dataset = JSON.parse(raw);

  let roadsToUpload = dataset.roads;
  if (limitSegments && limitSegments > 0 && roadsToUpload.length > limitSegments) {
    // Prioritize primary, trunk, secondary, tertiary, bridges, flyovers, key residential
    const priorityTypes = ['trunk', 'motorway', 'primary', 'secondary', 'tertiary', 'primary_link', 'secondary_link', 'tertiary_link', 'residential'];
    roadsToUpload = dataset.roads.filter((r: any) => priorityTypes.includes(r.road_type)).slice(0, limitSegments);
  }

  // Collect only the intersections referenced by the filtered roads
  const referencedNodeIds = new Set<string>();
  for (const road of roadsToUpload) {
    referencedNodeIds.add(road.source_node);
    referencedNodeIds.add(road.target_node);
  }

  const intersectionsToUpload = dataset.intersections.filter((i: any) => referencedNodeIds.has(i.node_id));

  console.log(`[Supabase Upload] Connecting to: ${supabaseUrl}`);
  console.log(`[Supabase Upload] Target payload: ${intersectionsToUpload.length} intersections and ${roadsToUpload.length} road segments.`);

  // 1. Upload Intersections in batches of 200
  const BATCH_SIZE = 200;
  console.log('[Supabase Upload] Uploading intersections...');
  let uploadedIntersections = 0;
  for (let i = 0; i < intersectionsToUpload.length; i += BATCH_SIZE) {
    const batch = intersectionsToUpload.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('intersections').upsert(batch, { onConflict: 'node_id' });
    if (error) {
      console.warn(`[Supabase Upload] Intersections batch ${i}-${i + batch.length} notice: ${error.message}`);
    } else {
      uploadedIntersections += batch.length;
    }
    if ((i / BATCH_SIZE) % 5 === 0) {
      process.stdout.write(`\rUploaded ${uploadedIntersections}/${intersectionsToUpload.length} intersections...`);
    }
  }
  console.log(`\n[Supabase Upload] Intersections upload complete (${uploadedIntersections} synced).`);

  // 2. Upload Roads in batches of 100
  console.log('[Supabase Upload] Uploading roads...');
  let uploadedRoads = 0;
  for (let i = 0; i < roadsToUpload.length; i += BATCH_SIZE) {
    const batch = roadsToUpload.slice(i, i + BATCH_SIZE).map((r: any) => ({
      road_id: r.road_id,
      road_name: r.road_name,
      district: r.district || 'NTR',
      source_node: r.source_node,
      target_node: r.target_node,
      start_lat: r.start_lat,
      start_lng: r.start_lng,
      end_lat: r.end_lat,
      end_lng: r.end_lng,
      distance_m: r.distance_m,
      travel_time_sec: r.travel_time_sec,
      status: r.status || 'open',
      coordinates: r.coordinates,
    }));

    const { error } = await supabase.from('roads').upsert(batch, { onConflict: 'road_id' });
    if (error) {
      console.warn(`[Supabase Upload] Roads batch ${i}-${i + batch.length} notice: ${error.message}`);
    } else {
      uploadedRoads += batch.length;
    }
    if ((i / BATCH_SIZE) % 5 === 0) {
      process.stdout.write(`\rUploaded ${uploadedRoads}/${roadsToUpload.length} roads...`);
    }
  }
  console.log(`\n[Supabase Upload] Roads upload complete (${uploadedRoads} synced).`);
  console.log('[Supabase Upload] All Vijayawada OSM data synchronized successfully!');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('uploadSupabase.ts')) {
  uploadNetworkToSupabase(3500)
    .then(() => {
      console.log('Upload task finished.');
    })
    .catch((err) => {
      console.error('Upload failed:', err);
      process.exit(1);
    });
}

