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

type RouteContext = { params: Promise<{ workspaceId: string; memberId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workspaceId, memberId } = await context.params;
  return api().updateRole(request, workspaceId, memberId);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { workspaceId, memberId } = await context.params;
  return api().remove(request, workspaceId, memberId);
}
