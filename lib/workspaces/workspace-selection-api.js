import { PersistenceError } from "../persistence/project-serialization.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";
import { consumeRateLimit, RequestGuardError } from "../security/request-guards.js";

export const ACTIVE_WORKSPACE_COOKIE = "tsa_active_workspace";
export const ACTIVE_WORKSPACE_COOKIE_PATH = "/";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const messages = {
  UNAUTHORIZED: "Sign in and choose a workspace you belong to.",
  VALIDATION_FAILURE: "A valid workspace ID is required.",
  FORBIDDEN: "You do not have access to this workspace.",
  RATE_LIMITED: "Too many requests. Please try again shortly.",
  CSRF_ORIGIN_MISMATCH: "Request origin is not allowed.",
  DATABASE_FAILURE: "Workspace service is temporarily unavailable.",
};

const known = (error) => error instanceof PersistenceError || error instanceof RequestGuardError || error instanceof CsrfError;

const errorResponse = (error) => {
  const code = known(error) ? error.code : "DATABASE_FAILURE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 : code === "RATE_LIMITED" ? 429 : code === "VALIDATION_FAILURE" ? 400 : 503;
  return new Response(JSON.stringify({ ok: false, error: { code, message: messages[code] || messages.DATABASE_FAILURE } }), {
    status,
    headers: { "content-type": "application/json" },
  });
};

export const createWorkspaceSelectionApi = ({ service, getAuthenticatedUserId, getCookieStore, isProduction = false }) => ({
  async current(request) {
    try {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
      const cookieStore = await getCookieStore();
      const activeWorkspace = await cookieStore?.get?.(ACTIVE_WORKSPACE_COOKIE);
      if (typeof activeWorkspace?.value === "string" && UUID.test(activeWorkspace.value)) {
        try {
          const workspace = await service.getWorkspaceForMember({
            userId,
            workspaceId: activeWorkspace.value,
          });
          return Response.json({ ok: true, data: { workspace } });
        } catch (error) {
          if (!(error instanceof PersistenceError) || !["PERSISTENCE_NOT_FOUND", "FORBIDDEN"].includes(error.code)) {
            throw error;
          }
        }
      }

      // A missing, malformed, archived, or no-longer-accessible selection must
      // not strand a returning user on an empty workspace screen. Prefer their
      // personal workspace, then the oldest active membership as a safe fallback.
      const workspaces = await service.listWorkspaces({ userId });
      const activeWorkspaces = (workspaces || []).filter((workspace) => workspace.status === "active");
      const fallback = activeWorkspaces.find((workspace) => workspace.isPersonal) || activeWorkspaces[0] || null;
      if (!fallback) return Response.json({ ok: true, data: { workspace: null } });

      const secure = isProduction ? "; Secure" : "";
      const cookie = `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(fallback.id)}; Path=${ACTIVE_WORKSPACE_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
      const headers = new Headers({ "content-type": "application/json", "set-cookie": cookie });
      return new Response(JSON.stringify({ ok: true, data: { workspace: fallback } }), { status: 200, headers });
    } catch (error) {
      return errorResponse(error);
    }
  },
  async select(request) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
      const userId = await getAuthenticatedUserId(request);
      if (!userId) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");

      let body;
      try { body = await request.json(); } catch { throw new PersistenceError("VALIDATION_FAILURE", "A valid workspace ID is required."); }
      const workspaceId = body?.workspaceId;
      if (Object.keys(body || {}).some((key) => key !== "workspaceId") || typeof workspaceId !== "string" || !UUID.test(workspaceId)) {
        throw new PersistenceError("VALIDATION_FAILURE", "A valid workspace ID is required.");
      }

      const workspace = await service.getWorkspaceForMember({ userId, workspaceId });
      const secure = isProduction ? "; Secure" : "";
      const cookie = `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(workspace.id)}; Path=${ACTIVE_WORKSPACE_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
      const headers = new Headers({ "content-type": "application/json" });
      headers.append("set-cookie", cookie);
      headers.append("set-cookie", `${ACTIVE_WORKSPACE_COOKIE}=; Path=/api/projects; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
      return new Response(JSON.stringify({ ok: true, data: workspace }), {
        status: 200,
        headers,
      });
    } catch (error) {
      return errorResponse(error);
    }
  },
});
