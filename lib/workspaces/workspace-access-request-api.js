import { PersistenceError } from "../persistence/project-serialization.js";
import { assertJsonRequest, assertRequestSize, consumeRateLimit, RequestGuardError } from "../security/request-guards.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const known = (error) => error instanceof PersistenceError || error instanceof RequestGuardError || error instanceof CsrfError;
const fail = (error) => {
  const code = known(error) ? error.code : "DATABASE_FAILURE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 : code === "PERSISTENCE_NOT_FOUND" ? 404 : code === "PERSISTENCE_CONFLICT" ? 409 : code === "RATE_LIMITED" ? 429 : code === "REQUEST_TOO_LARGE" || code === "INVALID_CONTENT_LENGTH" ? 413 : code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : code === "DATABASE_FAILURE" ? 503 : 400;
  const message = code === "UNAUTHORIZED" ? "Sign in to discover workspaces and request access." :
    code === "FORBIDDEN" ? "You do not have permission to complete this access request." :
    code === "PERSISTENCE_NOT_FOUND" ? "Workspace access request not found." :
    code === "PERSISTENCE_CONFLICT" ? "An access request is already pending or membership already exists." :
    code === "RATE_LIMITED" ? "Too many requests. Please try again shortly." :
    code === "DATABASE_FAILURE" ? "Workspace access request service is temporarily unavailable." :
    "Workspace access request details are invalid.";
  const headers = new Headers({ "content-type": "application/json" });
  if (error instanceof RequestGuardError && error.retryAfterSeconds) headers.set("retry-after", String(error.retryAfterSeconds));
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), { status, headers });
};
const getUser = async (request, resolver) => {
  const user = await resolver(request);
  if (!user?.id) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
  return user;
};
const assertWorkspaceId = (id) => {
  if (typeof id !== "string" || !UUID.test(id)) throw new PersistenceError("VALIDATION_FAILURE", "Workspace ID is invalid.");
  return id;
};
const parseBody = async (request, allowedKeys) => {
  assertJsonRequest(request);
  assertRequestSize(request, 4096);
  let body;
  try { body = await request.json(); } catch { throw new PersistenceError("VALIDATION_FAILURE", "Access request body must be valid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.includes(key))) {
    throw new PersistenceError("VALIDATION_FAILURE", "Access request fields are invalid.");
  }
  return body;
};

export const createWorkspaceAccessRequestApi = ({ service, getAuthenticatedUser }) => ({
  async discover(request) {
    try {
      consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const search = new URL(request.url).searchParams.get("q") || "";
      const workspaces = await service.listDiscoverableWorkspaces({ userId: user.id, search });
      return Response.json({ ok: true, data: { workspaces } });
    } catch (error) { return fail(error); }
  },
  async mine(request) {
    try {
      consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const requests = await service.listMyAccessRequests({ userId: user.id });
      return Response.json({ ok: true, data: { requests } });
    } catch (error) { return fail(error); }
  },
  async listForWorkspace(request, workspaceId) {
    try {
      consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const requests = await service.listAccessRequests({
        userId: user.id,
        workspaceId: assertWorkspaceId(workspaceId),
      });
      return Response.json({ ok: true, data: { requests } });
    } catch (error) { return fail(error); }
  },
  async request(request, workspaceId) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 10, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const body = await parseBody(request, ["message", "requestedRole"]);
      const message = body.message === undefined ? "" : body.message;
      const requestedRole = body.requestedRole === undefined ? "member" : body.requestedRole;
      if (typeof message !== "string" || message.length > 500 ||
          !["member", "viewer"].includes(requestedRole)) {
        throw new PersistenceError("VALIDATION_FAILURE", "Access request message or role is invalid.");
      }
      const result = await service.requestWorkspaceAccess({
        userId: user.id,
        workspaceId: assertWorkspaceId(workspaceId),
        message,
        requestedRole,
      });
      return Response.json({ ok: true, data: result }, { status: 201 });
    } catch (error) { return fail(error); }
  },
  async review(request, workspaceId, requestId) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      if (typeof requestId !== "string" || !UUID.test(requestId)) throw new PersistenceError("VALIDATION_FAILURE", "Access request ID is invalid.");
      const body = await parseBody(request, ["decision", "role"]);
      if (!["approve", "reject"].includes(body.decision) ||
          (body.role !== undefined && !["member", "viewer"].includes(body.role))) {
        throw new PersistenceError("VALIDATION_FAILURE", "Choose an allowed access request decision and role.");
      }
      const result = await service.reviewAccessRequest({
        userId: user.id,
        workspaceId: assertWorkspaceId(workspaceId),
        requestId,
        decision: body.decision,
        role: body.role || "member",
      });
      return Response.json({ ok: true, data: result });
    } catch (error) { return fail(error); }
  },
});
