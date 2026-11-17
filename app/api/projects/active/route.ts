import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import { createProjectApi } from "@/lib/persistence/api/project-api.js";
import {
  createServerProjectPersistenceService,
  serverProjectRegistries,
} from "@/lib/persistence/service/create-server-project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createProjectApi({
  service: createServerProjectPersistenceService(),
  registries: serverProjectRegistries,
  getCookieStore: cookies,
  getAuthenticatedUserId,
  isProduction: process.env.NODE_ENV === "production",
});

export async function GET(request: Request) {
  return api().getActive(request);
}
