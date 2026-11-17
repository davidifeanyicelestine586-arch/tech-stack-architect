import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { ProjectPersistenceService } from "@/lib/persistence/service/project-persistence-service";
import { createProjectApi } from "@/lib/persistence/api/project-api";
import { domains, components, recipes } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createProjectApi({
  service: new ProjectPersistenceService(createSupabaseServerClient()),
  registries: { domains, components, recipes },
  getCookieStore: cookies,
  getAuthenticatedUserId,
  isProduction: process.env.NODE_ENV === "production",
});

export async function GET(request: Request) {
  return api().getActive(request);
}
