import { PersistenceError } from "../persistence/project-serialization.js";
import { assertJsonRequest, assertRequestSize, consumeRateLimit, RequestGuardError } from "../security/request-guards.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const messages = {
  UNAUTHORIZED: "Sign in to manage workspace members.",
  FORBIDDEN: "You do not have permission to manage this workspace member.",
  VALIDATION_FAILURE: "Workspace member details are invalid.",
  PERSISTENCE_NOT_FOUND: "Workspace member not found.",
  RATE_LIMITED: "Too many requests. Please try again shortly.",
  REQUEST_TOO_LARGE: "Request body is too large.",
  INVALID_CONTENT_LENGTH: "Invalid request content length.",
  UNSUPPORTED_MEDIA_TYPE: "Request content type must be application/json.",
  CSRF_ORIGIN_MISMATCH: "Request origin is not allowed.",
  DATABASE_FAILURE: "Workspace member service is temporarily unavailable.",
};

const known = (error) => error instanceof PersistenceError || error instanceof RequestGuardError || error instanceof CsrfError;
const fail = (error) => {
  const code = known(error) ? error.code : "DATABASE_FAILURE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 : code === "PERSISTENCE_NOT_FOUND" ? 404 : code === "RATE_LIMITED" ? 429 : code === "REQUEST_TOO_LARGE" || code === "INVALID_CONTENT_LENGTH" ? 413 : code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : code === "DATABASE_FAILURE" ? 503 : 400;
  const headers = new Headers({ "content-type": "application/json" });
  if (error instanceof RequestGuardError && error.retryAfterSeconds) headers.set("retry-after", String(error.retryAfterSeconds));
  return new Response(JSON.stringify({ ok: false, error: { code, message: messages[code] || messages.DATABASE_FAILURE } }), { status, headers });
};

const getUser = async (request, resolver) => {
  const user = await resolver(request);
  if (!user?.id) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
  return user;
};
const assertUuid = (value, label) => {
  if (typeof value !== "string" || !UUID.test(value)) throw new PersistenceError("VALIDATION_FAILURE", `A valid ${label} is required.`);
  return value;
};
const parseRole = async (request) => {
  assertJsonRequest(request);
  assertRequestSize(request, 2048);
  let body;
  try { body = await request.json(); } catch { throw new PersistenceError("VALIDATION_FAILURE", "Member role body must be valid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "role") ||
      !["admin", "member", "viewer"].includes(body.role)) {
    throw new PersistenceError("VALIDATION_FAILURE", "Choose an allowed workspace role.");
  }
  return body.role;
};

export const createWorkspaceMemberApi = ({ service, getAuthenticatedUser }) => {
  if (!service || typeof getAuthenticatedUser !== "function") throw new Error("Workspace member service and authentication resolver are required.");
  return {
    async list(request, workspaceId) {
      try {
        consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
        const user = await getUser(request, getAuthenticatedUser);
        const members = await service.listMembers({ userId: user.id, workspaceId: assertUuid(workspaceId, "workspace ID") });
        return Response.json({ ok: true, data: { members } });
      } catch (error) { return fail(error); }
    },
    async updateRole(request, workspaceId, memberId) {
      try {
        assertSameOrigin(request);
        consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
        const user = await getUser(request, getAuthenticatedUser);
        const role = await parseRole(request);
        const result = await service.updateMemberRole({
          userId: user.id,
          workspaceId: assertUuid(workspaceId, "workspace ID"),
          memberId: assertUuid(memberId, "member ID"),
          role,
        });
        return Response.json({ ok: true, data: result });
      } catch (error) { return fail(error); }
    },
    async remove(request, workspaceId, memberId) {
      try {
        assertSameOrigin(request);
        consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
        const user = await getUser(request, getAuthenticatedUser);
        const result = await service.removeMember({
          userId: user.id,
          workspaceId: assertUuid(workspaceId, "workspace ID"),
          memberId: assertUuid(memberId, "member ID"),
        });
        return Response.json({ ok: true, data: result });
      } catch (error) { return fail(error); }
    },
  };
};
