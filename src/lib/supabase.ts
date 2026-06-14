import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Shared Supabase client for the admin dashboard and (later) public site reads.
// When the env vars are absent, the app falls back to the local demo store.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Supabase's new "Publishable" key (sb_publishable_...) replaces the legacy
// "anon" key. Prefer the publishable key; fall back to anon for older setups.
const publicKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(url && publicKey);

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
