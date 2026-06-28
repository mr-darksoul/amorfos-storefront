import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cache the client at module scope. Creating a new client per call spins up a
// fresh connection pool every time, which exhausts Supabase connections under
// load. The instance is reused across warm serverless invocations.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment.",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function supabase() {
  return getClient();
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
