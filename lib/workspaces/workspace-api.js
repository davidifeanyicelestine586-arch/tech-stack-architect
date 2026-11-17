import { PersistenceError } from "../persistence/project-serialization.js";
import { assertJsonRequest, assertRequestSize, consumeRateLimit, RequestGuardError } from "../security/request-guards.js";
import { assertSameOrigin, CsrfError } from "../security/csrf.js";

const messages = {
  UNAUTHORIZED: "Sign in to manage workspaces.",
  FORBIDDEN: "You do not have permission to perform this action.",
  VALIDATION_FAILURE: "Workspace details are invalid.",
  RATE_LIMITED: "Too many requests. Please try again shortly.",
  REQUEST_TOO_LARGE: "Request body is too large.",
  INVALID_CONTENT_LENGTH: "Invalid request content length.",
  UNSUPPORTED_MEDIA_TYPE: "Request content type must be application/json.",
  CSRF_ORIGIN_MISMATCH: "Request origin is not allowed.",
  DATABASE_FAILURE: "Workspace service is temporarily unavailable.",
  CONFIGURATION: "Workspace service is not configured.",
};

const isKnownError = (error) =>
  error instanceof PersistenceError ||
  error instanceof RequestGuardError ||
  error instanceof CsrfError;

const statusFor = (code) =>
  code === "UNAUTHORIZED" ? 401 :
  code === "FORBIDDEN" || code === "CSRF_ORIGIN_MISMATCH" ? 403 :
  code === "RATE_LIMITED" ? 429 :
  code === "REQUEST_TOO_LARGE" || code === "INVALID_CONTENT_LENGTH" ? 413 :
  code === "UNSUPPORTED_MEDIA_TYPE" ? 415 :
  code === "DATABASE_FAILURE" || code === "CONFIGURATION" ? 503 : 400;

const fail = (error, production = false) => {
  const code = isKnownError(error) ? error.code : "DATABASE_FAILURE";
  const headers = new Headers({ "content-type": "application/json" });
  if (error instanceof RequestGuardError && error.retryAfterSeconds) {
    headers.set("retry-after", String(error.retryAfterSeconds));
  }
  return new Response(JSON.stringify({
    ok: false,
    error: { code, message: messages[code] || messages.DATABASE_FAILURE },
  }), { status: statusFor(code), headers });
};

const parseBody = async (request) => {
  assertJsonRequest(request);
  assertRequestSize(request, 4096);
  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    throw new PersistenceError("VALIDATION_FAILURE", "Request body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new PersistenceError("VALIDATION_FAILURE", "Request body must be an object.");
  }
  const unexpected = Object.keys(body).filter((key) => key !== "name");
  if (unexpected.length) {
    throw new PersistenceError("VALIDATION_FAILURE", "Unsupported workspace fields were supplied.");
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    throw new PersistenceError("VALIDATION_FAILURE", "Workspace name must contain 2 to 80 characters.");
  }
  return { name };
};

export const createWorkspaceApi = ({ service, getAuthenticatedUserId, isProduction = false }) => {
  if (!service) throw new Error("Workspace service is required.");
  if (typeof getAuthenticatedUserId !== "function") throw new Error("Authentication resolver is required.");

  const run = async (request, operation) => {
    try {
      if (request.method === "POST") assertSameOrigin(request);
      consumeRateLimit(request, { limit: 30, windowMs: 60_000 });
      const userId = await getAuthenticatedUserId(request);
      if (!userId) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
      const data = await operation(userId);
      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      return fail(error, isProduction);
    }
  };

  return {
    list(request) {
      return run(request, (userId) => service.listWorkspaces({ userId }).then((workspaces) => ({ workspaces })));
    },
    create(request) {
      return run(request, async (userId) => {
        const { name } = await parseBody(request);
        return service.createWorkspace({ userId, name });
      });
    },
  };
};
