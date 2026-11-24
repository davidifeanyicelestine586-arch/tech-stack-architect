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

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  return api().list(request, workspaceId);
}

export async function POST(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  return api().create(request, workspaceId);
}
