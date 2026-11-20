import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import { resolveScope } from "@/lib/persistence/api/project-api";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createProjectMemberApi } from "@/lib/workspaces/project-member-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createProjectMemberApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getScope: async (request: Request) => {
    const resolved = await resolveScope({
      request,
      getCookieStore: cookies,
      getAuthenticatedUserId,
    });
    return resolved.scope;
  },
});

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { id, memberId } = await context.params;
  return api().remove(request, id, memberId);
}
