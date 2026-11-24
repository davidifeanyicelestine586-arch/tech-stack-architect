import { getAuthenticatedUser } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createWorkspaceInvitationApi } from "@/lib/workspaces/workspace-invitation-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createWorkspaceInvitationApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getAuthenticatedUser,
});

type RouteContext = { params: Promise<{ workspaceId: string; invitationId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { workspaceId, invitationId } = await context.params;
  return api().revoke(request, workspaceId, invitationId);
}
