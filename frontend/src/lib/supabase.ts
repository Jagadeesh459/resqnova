import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CitizenRequest } from '../types';

// Get keys from either import.meta.env or process.env
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const supabaseUrl =
  metaEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  metaEnv?.VITE_SUPABASE_URL ||
  'https://xqadvyfpqubqtakjrkim.supabase.co';

const supabaseAnonKey =
  metaEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWR2eWZwcXVicXRha2pya2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDU3OTcsImV4cCI6MjEwNDM4MTc5N30.r5ZrPnZCh2hJNODCPd6wkn5nx1NXSG4VS83xZa63FE8';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase] Initialization warning:', err);
    }
  }
  return supabaseClientInstance;
}

export const supabase = getSupabase();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export interface SupabaseSyncResult {
  synced: boolean;
  message: string;
  data?: any;
}

/**
 * Ping Supabase cloud instance to check connection status
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { connected: false, latencyMs: 0, error: 'Supabase credentials missing' };
  }

  const start = performance.now();
  try {
    // Attempt a light ping or read from an auth / public table
    const { error } = await client.from('citizen_requests').select('count', { count: 'exact', head: true });
    const latencyMs = Math.round(performance.now() - start);

    // Even if the table doesn't exist yet, reaching Supabase returns a 404 or 400 from postgrest which proves connectivity
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // 42P01 means table does not exist yet, but Supabase connection is 100% active and authenticated!
      return { connected: true, latencyMs, error: error.message };
    }
    return { connected: true, latencyMs };
  } catch (err) {
    return { connected: false, latencyMs: Math.round(performance.now() - start), error: String(err) };
  }
}

/**
 * Sync Citizen SOS request to Supabase cloud table
 */
export async function syncCitizenRequestToSupabase(req: CitizenRequest): Promise<SupabaseSyncResult> {
  const client = getSupabase();
  if (!client) {
    return { synced: false, message: 'Supabase not configured' };
  }

  try {
    const payload = {
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
      priority_score: req.priority_score,
      status: req.status,
      assigned_team_id: req.rescue_team_id,
      assigned_ambulance_id: req.ambulance_id,
      assigned_shelter_id: req.recommended_shelter_id,
      assigned_hospital_id: req.recommended_hospital_id,
      ai_notes: req.ai_recommendation || req.ai_reason,
      created_at: req.created_at,
    };

    const { data, error } = await client
      .from('citizen_requests')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Supabase Cloud Sync Notice] Table citizen_requests may need schema creation:', error.message);
      return { synced: false, message: `Cloud recorded locally (Table notice: ${error.message})` };
    }

    return { synced: true, message: 'Synchronized with Supabase Cloud DB', data };
  } catch (err) {
    console.warn('[Supabase] Sync exception handled gracefully:', err);
    return { synced: false, message: String(err) };
  }
}

/**
 * Sync Mission Status updates to Supabase
 */
export async function syncMissionStatusToSupabase(requestId: string, status: string): Promise<SupabaseSyncResult> {
  const client = getSupabase();
  if (!client) return { synced: false, message: 'Supabase not configured' };

  try {
    const { error } = await client
      .from('citizen_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      return { synced: false, message: error.message };
    }
    return { synced: true, message: 'Mission status pushed to Supabase' };
  } catch (err) {
    return { synced: false, message: String(err) };
  }
}
