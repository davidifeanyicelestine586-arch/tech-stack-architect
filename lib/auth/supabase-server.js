import { PersistenceError } from "@/lib/persistence/project-serialization.js";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";

const BEARER_PATTERN = /^Bearer\s+([^\s]+)$/i;

export const getBearerToken = (request) => {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(BEARER_PATTERN);
  if (!match?.[1]) {
    throw new PersistenceError("UNAUTHORIZED", "The authorization header is invalid.");
  }
  return match[1];
};

export const getAuthenticatedUserId = async (request) => {
  const token = getBearerToken(request);
  if (!token) return null;

  const client = createSupabaseServerClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user?.id) {
    throw new PersistenceError("UNAUTHORIZED", "The supplied access token is invalid.");
  }

  return data.user.id;
};
