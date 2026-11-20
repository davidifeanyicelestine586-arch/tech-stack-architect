import { PersistenceError } from "../persistence/project-serialization.js";
import { consumeRateLimit, RequestGuardError } from "../security/request-guards.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const known = (error) => error instanceof PersistenceError || error instanceof RequestGuardError;
const fail = (error) => {
  const code = known(error) ? error.code : "DATABASE_FAILURE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "RATE_LIMITED" ? 429 : code === "VALIDATION_FAILURE" ? 400 : 503;
  return Response.json({
    ok: false,
    error: {
      code,
      message: code === "UNAUTHORIZED" ? "Sign in to view workspace activity." :
        code === "FORBIDDEN" ? "You do not have access to this workspace." :
        code === "RATE_LIMITED" ? "Too many requests. Please try again shortly." :
        code === "VALIDATION_FAILURE" ? "Workspace ID is invalid." :
        "Workspace activity is temporarily unavailable.",
    },
  }, { status });
};

export const createWorkspaceActivityApi = ({ service, getAuthenticatedUser }) => ({
  async list(request, workspaceId) {
    try {
      consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
      const user = await getAuthenticatedUser(request);
      if (!user?.id) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
      if (typeof workspaceId !== "string" || !UUID.test(workspaceId)) {
        throw new PersistenceError("VALIDATION_FAILURE", "Workspace ID is invalid.");
      }
      const activity = await service.listActivity({ userId: user.id, workspaceId });
      return Response.json({ ok: true, data: { activity } });
    } catch (error) {
      return fail(error);
    }
  },
});
