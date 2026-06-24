import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;
let warned = false;

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * This bypasses Row Level Security, which is correct here because all
 * access control (which client owns which project, etc.) is enforced
 * explicitly in our route handlers via the authenticated clientId — not by RLS.
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client/browser.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    if (!warned) {
      console.error(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.",
      );
      warned = true;
    }
    return null;
  }

  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return supabase;
}
