import { PersistenceError } from "../project-serialization.js";

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

export class ProjectPersistenceApiError extends Error {
  constructor(code, message, { status = 0, details = undefined, cause = undefined } = {}) {
    super(message);
    this.name = "ProjectPersistenceApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.cause = cause;
  }
}

const getSafeError = (payload, status) => {
  const code = payload?.error?.code || "DATABASE_FAILURE";
  const message = safeMessages[code] || "Project persistence request failed.";
  return new ProjectPersistenceApiError(code, message, {
    status,
    details: Array.isArray(payload?.error?.details)
      ? payload.error.details
      : undefined,
  });
};

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (cause) {
    throw new ProjectPersistenceApiError(
      "DATABASE_FAILURE",
      safeMessages.DATABASE_FAILURE,
      { status: response.status, cause }
    );
  }
};

const request = async (fetcher, path, init) => {
  let response;
  try {
    response = await fetcher(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (cause) {
    throw new ProjectPersistenceApiError(
      "PERSISTENCE_UNAVAILABLE",
      safeMessages.PERSISTENCE_UNAVAILABLE,
      { cause }
    );
  }

  const payload = await parseJson(response);
  if (!response.ok || payload?.ok !== true) {
    throw getSafeError(payload, response.status);
  }
  return payload.data;
};

const assertRecord = (record) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new ProjectPersistenceApiError(
      "MALFORMED_RECORD",
      safeMessages.MALFORMED_RECORD
    );
  }
  if (!isUuid(record.id)) {
    throw new ProjectPersistenceApiError(
      "MALFORMED_RECORD",
      safeMessages.MALFORMED_RECORD
    );
  }
  if (!Number.isSafeInteger(record.revision) || record.revision < 1) {
    throw new ProjectPersistenceApiError(
      "MALFORMED_RECORD",
      safeMessages.MALFORMED_RECORD
    );
  }
  if (typeof record.createdAt !== "string" || typeof record.updatedAt !== "string") {
    throw new ProjectPersistenceApiError(
      "MALFORMED_RECORD",
      safeMessages.MALFORMED_RECORD
    );
  }
  if (!record.snapshot || typeof record.snapshot !== "object") {
    throw new ProjectPersistenceApiError(
      "MALFORMED_RECORD",
      safeMessages.MALFORMED_RECORD
    );
  }

  return {
    id: record.id,
    revision: record.revision,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    snapshot: record.snapshot,
  };
};

const assertSummary = (summary) => {
  const record = assertRecord(summary);
  return {
    id: record.id,
    revision: record.revision,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    name: record.snapshot.projectDefinition?.name || "",
    description: record.snapshot.projectDefinition?.description || "",
    domain: record.snapshot.projectDefinition?.domain || "",
    difficulty: record.snapshot.projectDefinition?.difficulty || "",
  };
};

export const createProjectPersistenceClient = (
  fetcher = globalThis.fetch,
  basePath = "/api/projects"
) => {
  if (typeof fetcher !== "function") {
    throw new ProjectPersistenceApiError(
      "PERSISTENCE_UNAVAILABLE",
      safeMessages.PERSISTENCE_UNAVAILABLE
    );
  }

  return {
    async create(snapshot) {
      return assertRecord(
        await request(fetcher, basePath, {
          method: "POST",
          body: JSON.stringify({ snapshot }),
        })
      );
    },

    async list() {
      const result = await request(fetcher, basePath, { method: "GET" });
      if (!result || !Array.isArray(result.projects)) {
        throw new ProjectPersistenceApiError(
          "MALFORMED_RECORD",
          safeMessages.MALFORMED_RECORD
        );
      }
      return result.projects.map(assertSummary);
    },

    async get(id) {
      return assertRecord(
        await request(fetcher, `${basePath}/${encodeURIComponent(id)}`, {
          method: "GET",
        })
      );
    },

    async update(id, snapshot, expectedRevision) {
      return assertRecord(
        await request(fetcher, `${basePath}/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ snapshot, expectedRevision }),
        })
      );
    },

    async remove(id) {
      const result = await request(fetcher, `${basePath}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!result || result.deleted !== true) {
        throw new ProjectPersistenceApiError(
          "MALFORMED_RECORD",
          safeMessages.MALFORMED_RECORD
        );
      }
      return true;
    },
  };
};

export { isUuid, safeMessages };
