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

type RouteContext = { params: Promise<{ workspaceId: string; requestId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workspaceId, requestId } = await context.params;
  return api().review(request, workspaceId, requestId);
}
