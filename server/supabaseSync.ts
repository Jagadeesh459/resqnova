import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CitizenRequest, RescueTeam, Ambulance } from '../src/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqadvyfpqubqtakjrkim.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWR2eWZwcXVicXRha2pya2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDU3OTcsImV4cCI6MjEwNDM4MTc5N30.r5ZrPnZCh2hJNODCPd6wkn5nx1NXSG4VS83xZa63FE8';

let client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!client) {
    try {
      client = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.warn('[Server Supabase] Client init warning:', e);
    }
  }
  return client;
}

export async function syncRequestToCloud(req: CitizenRequest) {
  const sb = getServerSupabase();
  if (!sb) return;

  try {
    const { error } = await sb.from('citizen_requests').upsert({
      id: req.id,
      request_id: req.request_id,
      citizen_name: req.citizen_name,
      citizen_phone: req.citizen_phone,
      latitude: req.latitude,
      longitude: req.longitude,
      address_hint: req.address_hint,
      people_count: req.people_count,
      children_count: req.children_count,
      elderly_count: req.elderly_count,
      emergency_type: req.emergency_type,
      medical_urgency: req.medical_urgency,
      risk_level: req.risk_level,
      risk_score: req.risk_score,
      priority_score: req.priority_score,
      status: req.status,
      assigned_team_id: req.rescue_team_id,
      assigned_ambulance_id: req.ambulance_id,
      created_at: req.created_at,
    }, { onConflict: 'id' });

    if (error) {
      // Table may not have been created yet, which is expected for fresh Supabase projects
      console.log(`[Supabase Sync] cloud table notice: ${error.message}`);
    } else {
      console.log(`[Supabase Sync] Successfully persisted SOS ${req.request_id} to Supabase cloud!`);
    }
  } catch (err) {
    console.warn('[Supabase Sync] Handled graceful cloud fallback:', err);
  }
}
