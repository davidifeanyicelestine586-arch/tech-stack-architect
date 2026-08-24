import {
  createProjectDefinition,
  validateProjectDefinition,
} from "../../engine/requirementAnalyzer.js";

export const PROJECT_SNAPSHOT_VERSION = 1;

const DIFFICULTIES = new Set(["Beginner", "Intermediate", "Advanced"]);
const RECORD_KEYS = new Set([
  "id",
  "name",
  "description",
  "domain_id",
  "difficulty",
  "requirements",
  "selected_component_ids",
  "active_recipe_id",
  "schema_version",
  "revision",
  "created_at",
  "updated_at",
]);

export class PersistenceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
    this.details = details;
  }
}

const invalidSnapshot = (message, errors = [message]) =>
  new PersistenceError("INVALID_SNAPSHOT", message, { errors });

const invalidRecord = (message, errors = [message]) =>
  new PersistenceError("INVALID_RECORD", message, { errors });

const unsupportedVersion = (version) =>
  new PersistenceError(
    "UNSUPPORTED_SCHEMA_VERSION",
    `Unsupported project snapshot schema version: ${String(version)}.`,
    { errors: [`Expected schema version ${PROJECT_SNAPSHOT_VERSION}.`] }
  );

const asRegistryIds = (registries, key) => {
  const values = registries?.[key];
  if (!Array.isArray(values)) return new Set();
  return new Set(values.map((item) => item?.id).filter(Boolean));
};

const assertSupportedVersion = (version) => {
  if (version === undefined || version === null) return;
  if (version !== PROJECT_SNAPSHOT_VERSION) {
    throw unsupportedVersion(version);
  }
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeComponentIds = (value) => {
  if (!Array.isArray(value)) {
    throw invalidSnapshot("selectedComponentIds must be an array.");
  }

  const normalized = [];
  const seen = new Set();
  for (const id of value) {
    if (typeof id !== "string" || !id.trim()) {
      throw invalidSnapshot(
        "selectedComponentIds must contain non-empty string IDs."
      );
    }

    const normalizedId = id.trim();
    if (!seen.has(normalizedId)) {
      seen.add(normalizedId);
      normalized.push(normalizedId);
    }
  }
  return normalized;
};

const normalizeProjectDefinition = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidSnapshot("projectDefinition must be an object.");
  }

  const difficulty = value.difficulty;
  if (!DIFFICULTIES.has(difficulty)) {
    throw invalidSnapshot(
      "Project difficulty must be Beginner, Intermediate, or Advanced."
    );
  }

  const project = {
    name: normalizeString(value.name),
    description: normalizeString(value.description),
    domain: normalizeString(value.domain),
    difficulty,
    requirements: normalizeString(value.requirements),
  };

  if (
    typeof project.name !== "string" ||
    typeof project.description !== "string" ||
    typeof project.domain !== "string" ||
    typeof project.requirements !== "string"
  ) {
    throw invalidSnapshot(
      "Project name, description, domain, and requirements must be strings."
    );
  }

  const validation = validateProjectDefinition(project);
  if (!validation.valid) {
    throw invalidSnapshot("Project definition is invalid.", validation.errors);
  }

  return createProjectDefinition(project);
};

const validateRegistryReferences = (snapshot, registries) => {
  const errors = [];
  const domainIds = asRegistryIds(registries, "domains");
  const componentIds = asRegistryIds(registries, "components");
  const recipeIds = asRegistryIds(registries, "recipes");

  if (!domainIds.has(snapshot.projectDefinition.domain)) {
    errors.push(`Unknown domain ID: ${snapshot.projectDefinition.domain}.`);
  }

  for (const componentId of snapshot.selectedComponentIds) {
    if (!componentIds.has(componentId)) {
      errors.push(`Unknown component ID: ${componentId}.`);
    }
  }

  if (snapshot.activeRecipeId !== null && !recipeIds.has(snapshot.activeRecipeId)) {
    errors.push(`Unknown recipe ID: ${snapshot.activeRecipeId}.`);
  }

  return errors;
};

export const normalizeProjectSnapshot = (input = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw invalidSnapshot("Project snapshot must be an object.");
  }

  assertSupportedVersion(input.schemaVersion);

  const projectDefinition = normalizeProjectDefinition(input.projectDefinition);
  const selectedComponentIds = normalizeComponentIds(input.selectedComponentIds);
  const activeRecipeId =
    input.activeRecipeId === null || input.activeRecipeId === undefined
      ? null
      : normalizeString(input.activeRecipeId);

  if (activeRecipeId !== null && !activeRecipeId) {
    return {
      schemaVersion: PROJECT_SNAPSHOT_VERSION,
      projectDefinition,
      selectedComponentIds,
      activeRecipeId: null,
    };
  }

  if (activeRecipeId !== null && typeof activeRecipeId !== "string") {
    throw invalidSnapshot("activeRecipeId must be a string or null.");
  }

  return {
    schemaVersion: PROJECT_SNAPSHOT_VERSION,
    projectDefinition,
    selectedComponentIds,
    activeRecipeId,
  };
};

export const validateProjectSnapshot = (snapshot, registries) => {
  try {
    const normalized = normalizeProjectSnapshot(snapshot);
    const referenceErrors = validateRegistryReferences(normalized, registries);
    return {
      valid: referenceErrors.length === 0,
      errors: referenceErrors,
      snapshot: normalized,
    };
  } catch (error) {
    if (error instanceof PersistenceError) {
      return {
        valid: false,
        errors: error.details?.errors || [error.message],
      };
    }
    throw error;
  }
};

const assertValidSnapshot = (snapshot, registries) => {
  const result = validateProjectSnapshot(snapshot, registries);
  if (!result.valid) {
    throw invalidSnapshot("Project snapshot is invalid.", result.errors);
  }
  return result.snapshot;
};

export const serializeProjectSnapshot = (snapshot, registries) => {
  const normalized = assertValidSnapshot(snapshot, registries);
  return {
    schema_version: PROJECT_SNAPSHOT_VERSION,
    name: normalized.projectDefinition.name,
    description: normalized.projectDefinition.description,
    domain_id: normalized.projectDefinition.domain,
    difficulty: normalized.projectDefinition.difficulty,
    requirements: normalized.projectDefinition.requirements,
    selected_component_ids: [...normalized.selectedComponentIds],
    active_recipe_id: normalized.activeRecipeId,
  };
};

const assertRecordShape = (record) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw invalidRecord("Persisted project record must be an object.");
  }

  const unknownKeys = Object.keys(record).filter((key) => !RECORD_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw invalidRecord(
      `Persisted project record contains unsupported fields: ${unknownKeys.join(", ")}.`
    );
  }

  const requiredKeys = [
    "id",
    "name",
    "description",
    "domain_id",
    "difficulty",
    "requirements",
    "selected_component_ids",
    "active_recipe_id",
    "schema_version",
    "revision",
    "created_at",
    "updated_at",
  ];
  const missingKeys = requiredKeys.filter((key) => !(key in record));
  if (missingKeys.length > 0) {
    throw invalidRecord(
      `Persisted project record is missing fields: ${missingKeys.join(", ")}.`
    );
  }

  if (typeof record.id !== "string" || !record.id.trim()) {
    throw invalidRecord("Persisted project record id must be a non-empty string.");
  }
  if (!Number.isSafeInteger(record.revision) || record.revision < 1) {
    throw invalidRecord("Persisted project record revision must be a positive integer.");
  }
  if (typeof record.created_at !== "string" || typeof record.updated_at !== "string") {
    throw invalidRecord("Persisted project record timestamps must be strings.");
  }
};

export const deserializeProjectRecord = (record, registries) => {
  try {
    assertRecordShape(record);
    assertSupportedVersion(record.schema_version);

    const snapshot = normalizeProjectSnapshot({
      schemaVersion: record.schema_version,
      projectDefinition: {
        name: record.name,
        description: record.description,
        domain: record.domain_id,
        difficulty: record.difficulty,
        requirements: record.requirements,
      },
      selectedComponentIds: record.selected_component_ids,
      activeRecipeId: record.active_recipe_id,
    });

    const validation = validateProjectSnapshot(snapshot, registries);
    if (!validation.valid) {
      throw invalidRecord("Persisted project record contains invalid project data.", validation.errors);
    }

    return {
      id: record.id,
      schemaVersion: PROJECT_SNAPSHOT_VERSION,
      revision: record.revision,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      snapshot: validation.snapshot,
    };
  } catch (error) {
    if (error instanceof PersistenceError) {
      if (error.code === "UNSUPPORTED_SCHEMA_VERSION") throw error;
      if (error.code === "INVALID_RECORD") throw error;
      throw invalidRecord(error.message, error.details?.errors || [error.message]);
    }
    throw error;
  }
};

