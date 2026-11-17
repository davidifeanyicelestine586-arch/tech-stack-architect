import { createHash, randomBytes } from "node:crypto";
import { PersistenceError } from "../persistence/project-serialization.js";
import { assertJsonRequest, assertRequestSize, consumeRateLimit, RequestGuardError } from "../security/request-guards.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";
import { ACTIVE_WORKSPACE_COOKIE, ACTIVE_WORKSPACE_COOKIE_PATH } from "./workspace-selection-api.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const messages = {
  UNAUTHORIZED: "Sign in with a verified email address to manage invitations.",
  FORBIDDEN: "You do not have permission to manage this workspace invitation.",
  VALIDATION_FAILURE: "Invitation details are invalid.",
  PERSISTENCE_NOT_FOUND: "The invitation is invalid, expired, or no longer available.",
  PERSISTENCE_CONFLICT: "The invitation conflicts with an existing request.",
  RATE_LIMITED: "Too many requests. Please try again shortly.",
  REQUEST_TOO_LARGE: "Request body is too large.",
  INVALID_CONTENT_LENGTH: "Invalid request content length.",
  UNSUPPORTED_MEDIA_TYPE: "Request content type must be application/json.",
  CSRF_ORIGIN_MISMATCH: "Request origin is not allowed.",
  DATABASE_FAILURE: "Workspace invitation service is temporarily unavailable.",
};

const isKnown = (error) =>
  error instanceof PersistenceError || error instanceof RequestGuardError || error instanceof CsrfError;

const statusFor = (code) =>
  code === "UNAUTHORIZED" ? 401 :
  code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 :
  code === "PERSISTENCE_NOT_FOUND" ? 404 :
  code === "PERSISTENCE_CONFLICT" ? 409 :
  code === "RATE_LIMITED" ? 429 :
  code === "REQUEST_TOO_LARGE" || code === "INVALID_CONTENT_LENGTH" ? 413 :
  code === "UNSUPPORTED_MEDIA_TYPE" ? 415 :
  code === "DATABASE_FAILURE" ? 503 : 400;

const fail = (error) => {
  const code = isKnown(error) ? error.code : "DATABASE_FAILURE";
  const headers = new Headers({ "content-type": "application/json" });
  if (error instanceof RequestGuardError && error.retryAfterSeconds) {
    headers.set("retry-after", String(error.retryAfterSeconds));
  }
  return new Response(JSON.stringify({
    ok: false,
    error: { code, message: messages[code] || messages.DATABASE_FAILURE },
  }), { status: statusFor(code), headers });
};

const requireUser = async (request, getAuthenticatedUser) => {
  const user = await getAuthenticatedUser(request);
  if (!user?.id) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
  return user;
};

const requireWorkspaceId = (workspaceId) => {
  if (typeof workspaceId !== "string" || !UUID.test(workspaceId)) {
    throw new PersistenceError("VALIDATION_FAILURE", "A valid workspace ID is required.");
  }
  return workspaceId;
};

const parseCreateBody = async (request) => {
  assertJsonRequest(request);
  assertRequestSize(request, 4096);
  let body;
  try { body = await request.json(); } catch {
    throw new PersistenceError("VALIDATION_FAILURE", "Invitation body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new PersistenceError("VALIDATION_FAILURE", "Invitation body must be an object.");
  }
  if (Object.keys(body).some((key) => !["email", "role"].includes(key))) {
    throw new PersistenceError("VALIDATION_FAILURE", "Unsupported invitation fields were supplied.");
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role;
  if (!EMAIL.test(email) || email.length > 254) {
    throw new PersistenceError("VALIDATION_FAILURE", "A valid invitation email is required.");
  }
  if (!["admin", "member", "viewer"].includes(role)) {
    throw new PersistenceError("VALIDATION_FAILURE", "Choose an allowed workspace role.");
  }
  return { email, role };
};

export const createWorkspaceInvitationApi = ({ service, getAuthenticatedUser }) => {
  if (!service || typeof getAuthenticatedUser !== "function") {
    throw new Error("Workspace invitation service and authentication resolver are required.");
  }

  return {
    async list(request, workspaceId) {
      try {
        consumeRateLimit(request, { limit: 60, windowMs: 60_000 });
        const user = await requireUser(request, getAuthenticatedUser);
        const invitations = await service.listInvitations({
          userId: user.id,
          workspaceId: requireWorkspaceId(workspaceId),
        });
        return Response.json({ ok: true, data: { invitations } });
      } catch (error) {
        return fail(error);
      }
    },

    async create(request, workspaceId) {
      try {
        assertSameOrigin(request);
        consumeRateLimit(request, { limit: 15, windowMs: 60_000 });
        const user = await requireUser(request, getAuthenticatedUser);
        const { email, role } = await parseCreateBody(request);
        const token = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 7 * DAY_MS).toISOString();
        const invitation = await service.createInvitation({
          userId: user.id,
          workspaceId: requireWorkspaceId(workspaceId),
          email,
          role,
          tokenHash,
          expiresAt,
        });
        const inviteUrl = new URL(\`/invite/accept?token=\${encodeURIComponent(token)}\`, request.url).toString();
        return Response.json({ ok: true, data: { invitation, inviteUrl } }, { status: 201 });
      } catch (error) {
        return fail(error);
      }
    },

    async revoke(request, workspaceId, invitationId) {
      try {
        assertSameOrigin(request);
        consumeRateLimit(request, { limit: 20, windowMs: 60_000 });
        const user = await requireUser(request, getAuthenticatedUser);
        if (typeof invitationId !== "string" || !UUID.test(invitationId)) {
          throw new PersistenceError("VALIDATION_FAILURE", "A valid invitation ID is required.");
        }
        const result = await service.revokeInvitation({
          userId: user.id,
          workspaceId: requireWorkspaceId(workspaceId),
          invitationId,
        });
        return Response.json({ ok: true, data: result });
      } catch (error) {
        return fail(error);
      }
    },
  };
};

export const createInvitationAcceptanceApi = ({ service, getAuthenticatedUser, isProduction = false }) => ({
  async accept(request) {
    try {
      assertSameOrigin(request);
      consumeRateLimit(request, { limit: 10, windowMs: 60_000 });
      const user = await requireUser(request, getAuthenticatedUser);
      if (!user.email || !user.emailConfirmedAt) {
        throw new PersistenceError("UNAUTHORIZED", "Verify your account email before accepting an invitation.");
      }
      assertJsonRequest(request);
      assertRequestSize(request, 2048);
      let body;
      try { body = await request.json(); } catch {
        throw new PersistenceError("VALIDATION_FAILURE", "Invitation token is invalid.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body) ||
          Object.keys(body).some((key) => key !== "token") ||
          typeof body.token !== "string" || !TOKEN.test(body.token)) {
        throw new PersistenceError("VALIDATION_FAILURE", "Invitation token is invalid.");
      }

      const tokenHash = createHash("sha256").update(body.token).digest("hex");
      const result = await service.acceptInvitation({
        userId: user.id,
        email: user.email,
        tokenHash,
      });
      const secure = isProduction ? "; Secure" : "";
      const cookie = \`\${ACTIVE_WORKSPACE_COOKIE}=\${encodeURIComponent(result.workspaceId)}; Path=\${ACTIVE_WORKSPACE_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=2592000\${secure}\`;
      return new Response(JSON.stringify({ ok: true, data: result }), {
        status: 200,
        headers: { "content-type": "application/json", "set-cookie": cookie },
      });
    } catch (error) {
      return fail(error);
    }
  },
});
