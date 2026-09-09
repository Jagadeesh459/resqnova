import { createClient } from "@/lib/supabase/client";

const peopleCountValue: Record<string, number> = { "1": 1, "2-3": 2, "4-8": 4, "9+": 9 };

export async function submitCitizenRequest(input: { emergencyType: string; peopleCount: string; latitude: number; longitude: number }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in before submitting an SOS request.");
  const { data: profile, error: profileError } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (profileError || !profile) throw profileError ?? new Error("Your ResQNova profile is not ready yet.");
  const { data, error } = await supabase.from("citizen_requests").insert({
    citizen_id: profile.id,
    latitude: input.latitude,
    longitude: input.longitude,
    people_count: peopleCountValue[input.peopleCount] ?? 1,
    emergency_type: input.emergencyType,
  }).select("id,request_id,status").single();
  if (error) throw error;
  try {
    const dispatchResponse = await fetch("/api/ai/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: data.id }),
    });
    const dispatch = await dispatchResponse.json() as { error?: string; [key: string]: unknown };
    return { ...data, dispatch, dispatchError: dispatchResponse.ok ? undefined : dispatch.error };
  } catch (dispatchError) {
    return { ...data, dispatchError: dispatchError instanceof Error ? dispatchError.message : "AI dispatch is pending." };
  }
}

export function subscribeToCitizenRequests(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase.channel("citizen-requests").on("postgres_changes", { event: "*", schema: "public", table: "citizen_requests" }, onChange).on("postgres_changes", { event: "*", schema: "public", table: "rescue_missions" }, onChange);
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}
