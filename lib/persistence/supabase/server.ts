import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PersistenceError } from "../project-serialization.js";

export interface SupabaseServerConfig {
  url?: string;
  serviceRoleKey?: string;
}

/**
 * Creates the privileged client used only by server-side repository code.
 * Never import this module from a React client component and never expose the
 * service-role key through a NEXT_PUBLIC_ variable.
 */
export function createSupabaseServerClient(
  config: SupabaseServerConfig = {}
): SupabaseClient {
  const url = config.url ?? process.env.SUPABASE_URL;
  const serviceRoleKey =
    config.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new PersistenceError(
      "CONFIGURATION",
      "Supabase persistence is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
