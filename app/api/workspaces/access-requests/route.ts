import { getAuthenticatedUser } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createWorkspaceAccessRequestApi } from "@/lib/workspaces/workspace-access-request-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createWorkspaceAccessRequestApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getAuthenticatedUser,
});

export async function GET(request: Request) {
  return api().mine(request);
}
