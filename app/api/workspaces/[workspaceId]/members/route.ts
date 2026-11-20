import { getAuthenticatedUser } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createWorkspaceMemberApi } from "@/lib/workspaces/workspace-member-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createWorkspaceMemberApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getAuthenticatedUser,
});

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  return api().list(request, workspaceId);
}
