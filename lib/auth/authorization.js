import { PersistenceError } from "@/lib/persistence/project-serialization.js";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { getBearerToken } from "./supabase-server";

export const ADMIN_ROLE = "admin";

export function getUserRole(user) {
  const role = user?.app_metadata?.role;
  return typeof role === "string" ? role : null;
}

export function isAdminUser(user) {
  return getUserRole(user) === ADMIN_ROLE;
}

export async function getAuthenticatedUser(request) {
  const token = getBearerToken(request);
  if (!token) return null;

  const client = createSupabaseServerClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new PersistenceError("UNAUTHORIZED", "The supplied access token is invalid.");
  }

  return data.user;
}

export async function requireAdminUser(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
  }
  if (!isAdminUser(user)) {
    throw new PersistenceError("FORBIDDEN", "Administrator permission is required.");
  }
  return user;
}
