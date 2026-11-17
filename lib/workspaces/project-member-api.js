import { PersistenceError } from "../persistence/project-serialization.js";
import { assertJsonRequest, assertRequestSize, consumeRateLimit, RequestGuardError } from "../security/request-guards.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const known = (error) => error instanceof PersistenceError || error instanceof RequestGuardError || error instanceof CsrfError;
const fail = (error) => {
  const code = known(error) ? error.code : "DATABASE_FAILURE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 : code === "PERSISTENCE_NOT_FOUND" ? 404 : code === "RATE_LIMITED" ? 429 : code === "REQUEST_TOO_LARGE" || code === "INVALID_CONTENT_LENGTH" ? 413 : code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : code === "DATABASE_FAILURE" ? 503 : 400;
  const message = code === "UNAUTHORIZED" ? "Sign in to manage project access." :
    code === "FORBIDDEN" ? "Select a workspace and verify Project Admin permission." :
    code === "PERSISTENCE_NOT_FOUND" ? "Project or workspace member not found." :
    code === "RATE_LIMITED" ? "Too many requests. Please try again shortly." :
    code === "UNSUPPORTED_MEDIA_TYPE" ? "Request content type must be application/json." :
    code === "DATABASE_FAILURE" ? "Project access service is temporarily unavailable." :
    "Project access details are invalid.";
  const headers = new Headers({ "content-type": "application/json" });
  if (error instanceof RequestGuardError && error.retryAfterSeconds) headers.set("retry-after", String(error.retryAfterSeconds));
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), { status, headers });
};
const requireScope = async (request, getScope) => {
  const scope = await getScope(request);
  if (scope?.kind !== "workspace" || !scope.userId || !scope.workspaceId) {
    throw new PersistenceError("FORBIDDEN", "An active workspace is required.");
  }
  return scope;
};
const assertProjectId = (projectId) => {
  if (typeof projectId !== "string" || !UUID.test(projectId)) throw new PersistenceError("VALIDATION_FAILURE", "Project ID is invalid.");
  return projectId;
};
const parseGrant = async (request) => {
  assertJsonRequest(request);
  assertRequestSize(request, 2048);
  let body;
  try { body = await request.json(); } catch { throw new PersistenceError("VALIDATION_FAILURE", "Project access body must be valid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["userId", "role"].includes(key)) ||
      typeof body.userId !== "string" || !UUID.test(body.userId) ||
      !["project_admin", "editor", "viewer"].includes(body.role)) {
    throw new PersistenceError("VALIDATION_FAILURE", "Choose a workspace member and an allowed project role.");
  }
  return { memberId: body.userId, role: body.role };
};

export const createProjectMemberApi = ({ service, getScope }) => {
  if (!service || typeof getScope !== "function") throw new Error("Project member service and scope resolver are required.");
  return {
    async list(request, projectId) {
      try {
        consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
        const scope = await requireScope(request, getScope);
        const members = await service.listProjectMembers({
          userId: scope.userId,
          workspaceId: scope.workspaceId,
          projectId: assertProjectId(projectId),
        });
        return Response.json({ ok: true, data: { members } });
      } catch (error) { return fail(error); }
    },
    async grant(request, projectId) {
      try {
        assertSameOrigin(request);
        consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
        const scope = await requireScope(request, getScope);
        const { memberId, role } = await parseGrant(request);
        const result = await service.grantProjectMember({
          userId: scope.userId,
          workspaceId: scope.workspaceId,
          projectId: assertProjectId(projectId),
          memberId,
          role,
        });
        return Response.json({ ok: true, data: result }, { status: 201 });
      } catch (error) { return fail(error); }
    },
    async remove(request, projectId, memberId) {
      try {
        assertSameOrigin(request);
        consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
        const scope = await requireScope(request, getScope);
        if (typeof memberId !== "string" || !UUID.test(memberId)) {
          throw new PersistenceError("VALIDATION_FAILURE", "Member ID is invalid.");
        }
        const result = await service.removeProjectMember({
          userId: scope.userId,
          workspaceId: scope.workspaceId,
          projectId: assertProjectId(projectId),
          memberId,
        });
        return Response.json({ ok: true, data: result });
      } catch (error) { return fail(error); }
    },
  };
};
