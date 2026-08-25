import { randomUUID } from "node:crypto";
import {
  PersistenceError,
  validateProjectSnapshot,
} from "../project-serialization.js";

export const ANONYMOUS_SESSION_COOKIE = "ediccrew_project_session";
export const ANONYMOUS_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const ANONYMOUS_SESSION_COOKIE_PATH = "/api/projects";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === "string" && UUID_PATTERN.test(value);

const safeMessages = {
  INVALID_SNAPSHOT: "Project data is invalid.",
  INVALID_RECORD: "Saved project data is invalid.",
  UNSUPPORTED_SCHEMA_VERSION: "This saved project version is not supported.",
  UNKNOWN_REFERENCE: "Project data contains an unknown registry reference.",
  VALIDATION_FAILURE: "Project data is invalid.",
  UNAUTHORIZED: "This project request is not authorized.",
  DATABASE_FAILURE: "Project persistence is temporarily unavailable.",
  MALFORMED_RECORD: "The saved project record is malformed.",
  PERSISTENCE_UNAVAILABLE: "Project persistence is temporarily unavailable.",
  PERSISTENCE_CONFLICT: "The project changed elsewhere. Reload before saving again.",
  PERSISTENCE_NOT_FOUND: "Project not found.",
  CONFIGURATION: "Project persistence is not configured.",
};

const errorResponse = (error) => {
  const code = error instanceof PersistenceError ? error.code : "DATABASE_FAILURE";
  return {
    ok: false,
    error: {
      code,
      message: safeMessages[code] || "Project persistence request failed.",
    },
  };
};

const successResponse = (data) => ({ ok: true, data });

const serializeCookie = (sessionId, isProduction) => {
  const attributes = [
    `${ANONYMOUS_SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
    `Max-Age=${ANONYMOUS_SESSION_COOKIE_MAX_AGE}`,
    `Path=${ANONYMOUS_SESSION_COOKIE_PATH}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProduction) attributes.push("Secure");
  return attributes.join("; ");
};

const response = (payload, status, sessionId, isProduction) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (sessionId) {
    headers.append("set-cookie", serializeCookie(sessionId, isProduction));
  }
  return new Response(JSON.stringify(payload), { status, headers });
};

const statusForCode = (code) =>
  code === "PERSISTENCE_NOT_FOUND" ? 404 :
  code === "PERSISTENCE_CONFLICT" ? 409 :
  code === "UNAUTHORIZED" ? 401 :
  code === "DATABASE_FAILURE" || code === "PERSISTENCE_UNAVAILABLE" || code === "CONFIGURATION" ? 503 :
  400;

export const createFailureResponse = (error, isProduction = false) => {
  const code = error instanceof PersistenceError ? error.code : "DATABASE_FAILURE";
  return response(errorResponse(error), statusForCode(code), null, isProduction);
};

const badRequest = (message) =>
  new PersistenceError("VALIDATION_FAILURE", message, { errors: [message] });

const assertPlainObject = (value, label) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(`${label} must be an object.`);
  }
};

const parseJson = async (request) => {
  try {
    const body = await request.json();
    assertPlainObject(body, "Request body");
    return body;
  } catch (error) {
    if (error instanceof PersistenceError) throw error;
    throw badRequest("Request body must contain valid JSON.");
  }
};

const assertAllowedKeys = (body, allowedKeys) => {
  const unexpected = Object.keys(body).filter((key) => !allowedKeys.includes(key));
  if (unexpected.length > 0) {
    throw badRequest(`Unsupported request fields: ${unexpected.join(", ")}.`);
  }
};

const parseSnapshotBody = async (request, allowedKeys, registries) => {
  const body = await parseJson(request);
  assertAllowedKeys(body, allowedKeys);
  if (!("snapshot" in body)) throw badRequest("A project snapshot is required.");
  assertPlainObject(body.snapshot, "snapshot");

  const validation = validateProjectSnapshot(body.snapshot, registries);
  if (!validation.valid) {
    throw new PersistenceError("VALIDATION_FAILURE", "Project snapshot validation failed.", {
      errors: validation.errors,
    });
  }

  return {
    snapshot: validation.snapshot,
    expectedRevision: body.expectedRevision,
  };
};

const resolveProjectId = async (context) => {
  const params = await context?.params;
  const id = params?.id;
  if (!isUuid(id)) throw badRequest("A valid project ID is required.");
  return id;
};

const resolveAnonymousSession = async (getCookieStore) => {
  const cookieStore = await getCookieStore();
  const existing = await cookieStore?.get?.(ANONYMOUS_SESSION_COOKIE);
  if (isUuid(existing?.value)) {
    return { scope: { kind: "anonymous", sessionId: existing.value }, setCookie: null };
  }

  const sessionId = randomUUID();
  return {
    scope: { kind: "anonymous", sessionId },
    setCookie: sessionId,
  };
};

const run = async ({ getCookieStore, service, isProduction, logger }, operation) => {
  let session;
  try {
    session = await resolveAnonymousSession(getCookieStore);
    const data = await operation(session.scope);
    return response(successResponse(data), 200, session.setCookie, isProduction);
  } catch (error) {
    if (logger && !(error instanceof PersistenceError)) logger(error);
    const code = error instanceof PersistenceError ? error.code : "DATABASE_FAILURE";
    const failed = createFailureResponse(error, isProduction);
    if (session?.setCookie) {
      failed.headers.set("set-cookie", serializeCookie(session.scope.sessionId, isProduction));
    }
    return failed;
  }
};

/**
 * @param {{
 *   service: object,
 *   registries: object,
 *   getCookieStore: () => Promise<object>,
 *   isProduction?: boolean,
 *   logger?: ((error: unknown) => void) | null,
 * }} options
 */
export const createProjectApi = ({
  service,
  registries,
  getCookieStore,
  isProduction = false,
  logger = null,
}) => {
  if (!service) throw new Error("Project persistence service is required.");
  if (!getCookieStore) throw new Error("A cookie-store factory is required.");

  const dependencies = { service, registries, getCookieStore, isProduction, logger };

  return {
    async create(request) {
      return run(dependencies, async (scope) => {
        const { snapshot } = await parseSnapshotBody(request, ["snapshot"], dependencies.registries);
        return dependencies.service.createProject({ scope, snapshot });
      });
    },

    async list() {
      return run(dependencies, async (scope) => {
        const projects = await dependencies.service.listProjects({ scope });
        return { projects };
      });
    },

    async get(context) {
      return run(dependencies, async (scope) => {
        const id = await resolveProjectId(context);
        return dependencies.service.getProject({ scope, id });
      });
    },

    async update(request, context) {
      return run(dependencies, async (scope) => {
        const id = await resolveProjectId(context);
        const { snapshot, expectedRevision } = await parseSnapshotBody(request, [
          "snapshot",
          "expectedRevision",
        ], dependencies.registries);
        if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
          throw badRequest("A positive expectedRevision is required.");
        }
        return dependencies.service.updateProject({
          scope,
          id,
          expectedRevision,
          snapshot,
        });
      });
    },

    async remove(context) {
      return run(dependencies, async (scope) => {
        const id = await resolveProjectId(context);
        await dependencies.service.deleteProject({ scope, id });
        return { deleted: true };
      });
    },
  };
};

export { isUuid, resolveAnonymousSession, safeMessages, serializeCookie };
