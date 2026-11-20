import { PersistenceError } from "../persistence/project-serialization.js";
import { assertJsonRequest, assertRequestSize, consumeRateLimit, RequestGuardError } from "../security/request-guards.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const known = (error) => error instanceof PersistenceError || error instanceof RequestGuardError || error instanceof CsrfError;
const fail = (error) => {
  const code = known(error) ? error.code : "DATABASE_FAILURE";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 : code === "PERSISTENCE_NOT_FOUND" ? 404 : code === "RATE_LIMITED" ? 429 : code === "REQUEST_TOO_LARGE" || code === "INVALID_CONTENT_LENGTH" ? 413 : code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : code === "DATABASE_FAILURE" ? 503 : 400;
  const message = code === "UNAUTHORIZED" ? "Sign in to manage workspace settings." :
    code === "FORBIDDEN" ? "You do not have permission to manage this workspace." :
    code === "PERSISTENCE_NOT_FOUND" ? "Workspace not found or unavailable." :
    code === "RATE_LIMITED" ? "Too many requests. Please try again shortly." :
    code === "DATABASE_FAILURE" ? "Workspace settings are temporarily unavailable." :
    code === "VALIDATION_FAILURE" ? error.message : "Workspace settings are invalid.";
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
const parseJson = async (request, allowedKeys) => {
  assertJsonRequest(request);
  assertRequestSize(request, 4096);
  let body;
  try { body = await request.json(); } catch { throw new PersistenceError("VALIDATION_FAILURE", "Workspace settings body must be valid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.includes(key))) {
    throw new PersistenceError("VALIDATION_FAILURE", "Workspace settings fields are invalid.");
  }
  return body;
};

export const createWorkspaceLifecycleApi = ({ service, getAuthenticatedUser }) => ({
  async update(request, workspaceId) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 15, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const body = await parseJson(request, ["name", "visibility"]);
      const id = assertWorkspaceId(workspaceId);
      const result = {};
      if (body.name !== undefined) result.name = (await service.renameWorkspace({ userId: user.id, workspaceId: id, name: body.name })).name;
      if (body.visibility !== undefined) result.visibility = (await service.setWorkspaceVisibility({ userId: user.id, workspaceId: id, visibility: body.visibility })).visibility;
      if (!Object.keys(result).length) throw new PersistenceError("VALIDATION_FAILURE", "Provide a workspace name or visibility.");
      return Response.json({ ok: true, data: result });
    } catch (error) { return fail(error); }
  },
  async transfer(request, workspaceId) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 5, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const body = await parseJson(request, ["newOwnerId"]);
      if (typeof body.newOwnerId !== "string" || !UUID.test(body.newOwnerId)) throw new PersistenceError("VALIDATION_FAILURE", "Choose a valid new owner.");
      const result = await service.transferWorkspaceOwnership({
        userId: user.id,
        workspaceId: assertWorkspaceId(workspaceId),
        newOwnerId: body.newOwnerId,
      });
      return Response.json({ ok: true, data: result });
    } catch (error) { return fail(error); }
  },
  async archive(request, workspaceId) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 5, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const result = await service.archiveWorkspace({ userId: user.id, workspaceId: assertWorkspaceId(workspaceId) });
      return Response.json({ ok: true, data: result });
    } catch (error) { return fail(error); }
  },
  async restore(request, workspaceId) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 5, windowMs: 60_000 });
      const user = await getUser(request, getAuthenticatedUser);
      const result = await service.restoreWorkspace({ userId: user.id, workspaceId: assertWorkspaceId(workspaceId) });
      return Response.json({ ok: true, data: result });
    } catch (error) { return fail(error); }
  },
});
