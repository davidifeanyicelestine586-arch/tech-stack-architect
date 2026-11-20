import { getAuthenticatedUser } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createInvitationAcceptanceApi } from "@/lib/workspaces/workspace-invitation-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createInvitationAcceptanceApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getAuthenticatedUser,
  isProduction: process.env.NODE_ENV === "production",
});

export async function POST(request: Request) {
  return api().accept(request);
}
