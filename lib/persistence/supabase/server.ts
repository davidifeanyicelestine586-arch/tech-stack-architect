import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PersistenceError } from "../project-serialization.js";
import { getServerConfig } from "../../config/server-config.js";

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
  let url = config.url;
  let serviceRoleKey = config.serviceRoleKey;

  if (!url || !serviceRoleKey) {
    const serverConfig = getServerConfig();
    url = url ?? serverConfig.supabaseUrl;
    serviceRoleKey = serviceRoleKey ?? serverConfig.supabaseServiceRoleKey;
  }

  if (!url || !serviceRoleKey) {
    throw new PersistenceError("CONFIGURATION", "Supabase persistence is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
