import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CitizenRequest, RescueTeam, Ambulance, Road } from '../frontend/src/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqadvyfpqubqtakjrkim.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWR2eWZwcXVicXRha2pya2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDU3OTcsImV4cCI6MjEwNDM4MTc5N30.r5ZrPnZCh2hJNODCPd6wkn5nx1NXSG4VS83xZa63FE8';

let client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!client) {
    try {
      client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
    } catch (e) {
      console.warn('[Server Supabase] Client init warning:', e);
    }
  }
  return client;
}

export async function fetchCloudRoads(): Promise<Road[]> {
  const sb = getServerSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('roads').select('*');
    if (error || !data) {
      console.warn('[Supabase Roads] fetch notice:', error?.message);
      return [];
    }
    return data.map((r: any) => ({
      id: r.id,
      road_name: r.road_name || r.name,
      district: r.district || 'NTR',
      status: r.status || 'open',
      blocked_reason: r.blocked_reason,
      start_lat: r.start_lat,
      start_lng: r.start_lng,
      end_lat: r.end_lat,
      end_lng: r.end_lng,
      travel_time: r.travel_time_min || r.travel_time || 10,
      risk_score: r.risk_score != null ? Math.round(r.risk_score) : 10,
      updated_at: r.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[Supabase Roads] Exception handled:', err);
    return [];
  }
}

export async function syncRoadStatusToCloud(roadId: string, status: string, blocked_reason?: string) {
  const sb = getServerSupabase();
  if (!sb) return;
  try {
    const { error } = await sb
      .from('roads')
      .update({
        status,
        ...(blocked_reason !== undefined && { blocked_reason }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', roadId);

    if (error) {
      console.warn(`[Supabase Road Update] Notice for ${roadId}:`, error.message);
    }
  } catch (err) {
    console.warn('[Supabase Road Update] Exception handled:', err);
  }
}

export function subscribeToRoadChanges(onRoadChanged: (road: any) => void): () => void {
  const sb = getServerSupabase();
  if (!sb) return () => {};

  try {
    const channel = sb
      .channel('schema-db-roads-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'roads' }, (payload) => {
        if (payload.new) {
          onRoadChanged(payload.new);
        }
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Subscribe exception:', err);
    return () => {};
  }
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
      console.log(`[Supabase Sync] cloud table notice: ${error.message}`);
    } else {
      console.log(`[Supabase Sync] Successfully persisted SOS ${req.request_id} to Supabase cloud!`);
    }
  } catch (err) {
    console.warn('[Supabase Sync] Handled graceful cloud fallback:', err);
  }
}
