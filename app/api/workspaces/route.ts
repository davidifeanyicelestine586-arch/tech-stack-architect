import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createWorkspaceApi } from "@/lib/workspaces/workspace-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createWorkspaceApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getAuthenticatedUserId,
  isProduction: process.env.NODE_ENV === "production",
});

export async function GET(request: Request) {
  return api().list(request);
}

export async function POST(request: Request) {
  return api().create(request);
}
