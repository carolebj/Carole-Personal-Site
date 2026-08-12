import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Shared Supabase client for the admin dashboard and (later) public site reads.
// When the env vars are absent in local/dev (or an explicit preview opt-in),
// the dashboard may use the local demo store. Production builds fail closed.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Supabase's new "Publishable" key (sb_publishable_...) replaces the legacy
// "anon" key. Prefer the publishable key; fall back to anon for older setups.
const publicKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(url && publicKey);

/** Local demo CMS is allowed in Vite DEV, or when explicitly opted in (e.g. Preview). */
export function canUseDemoDashboard(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DASHBOARD_DEMO === "true";
}

/** Production without Supabase must not open the unrestricted demo login. */
export function isDashboardMisconfigured(): boolean {
  return !isSupabaseConfigured && !canUseDemoDashboard();
}

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !publicKey) {
    return null;
  }
  cached ??= createClient(url, publicKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cached;
}
