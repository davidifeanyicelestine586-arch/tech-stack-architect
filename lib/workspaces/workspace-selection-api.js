import { PersistenceError } from "../persistence/project-serialization.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";
import { consumeRateLimit, RequestGuardError } from "../security/request-guards.js";

export const ACTIVE_WORKSPACE_COOKIE = "tsa_active_workspace";
export const ACTIVE_WORKSPACE_COOKIE_PATH = "/api/projects";
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

export const createWorkspaceSelectionApi = ({ service, getAuthenticatedUserId, isProduction = false }) => ({
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
      return new Response(JSON.stringify({ ok: true, data: workspace }), {
        status: 200,
        headers: { "content-type": "application/json", "set-cookie": cookie },
      });
    } catch (error) {
      return errorResponse(error);
    }
  },
});
