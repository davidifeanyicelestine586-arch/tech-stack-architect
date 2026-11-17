import { cookies } from "next/headers";
import { getAuthenticatedUserId } from "@/lib/auth/supabase-server";
import { createSupabaseServerClient } from "@/lib/persistence/supabase/server";
import { WorkspaceService } from "@/lib/persistence/service/workspace-service";
import { createWorkspaceSelectionApi } from "@/lib/workspaces/workspace-selection-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const api = () => createWorkspaceSelectionApi({
  service: new WorkspaceService(createSupabaseServerClient()),
  getAuthenticatedUserId,
  getCookieStore: cookies,
  isProduction: process.env.NODE_ENV === "production",
});

export async function POST(request: Request) {
  return api().select(request);
}

export async function GET(request: Request) {
  return api().current(request);
}
