import {
  createProjectDefinition,
  validateProjectDefinition,
} from "../../engine/requirementAnalyzer.js";

export const PROJECT_SNAPSHOT_VERSION = 2;
export const LEGACY_PROJECT_SNAPSHOT_VERSION = 1;

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
  "architecture",
  "development_plan",
  "schema_version",
  "revision",
  "created_at",
  "updated_at",
  "owner_id",
  "anonymous_session_id",
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
    { errors: ["Expected schema version 1 or 2."] }
  );

const asRegistryIds = (registries, key) => {
  const values = registries?.[key];
  if (!Array.isArray(values)) return new Set();
  return new Set(values.map((item) => item?.id).filter(Boolean));
};

const assertSupportedVersion = (version) => {
  if (version !== LEGACY_PROJECT_SNAPSHOT_VERSION && version !== PROJECT_SNAPSHOT_VERSION) {
    throw unsupportedVersion(version);
  }
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeTextList = (value, field) => {
  if (!Array.isArray(value)) throw invalidSnapshot(`${field} must be an array.`);
  const normalized = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      throw invalidSnapshot(`${field} must contain non-empty strings.`);
    }
    normalized.push(item.trim());
  }
  return [...new Set(normalized)];
};

const normalizeUniqueIds = (items, field) => {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw invalidSnapshot(`${field} must contain unique IDs.`);
  }
};

const normalizeArchitecture = (value) => {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidSnapshot("architecture must be an object or null.");
  }
  if (value.schemaVersion !== 1) {
    throw invalidSnapshot("architecture schemaVersion must be 1.");
  }
  for (const field of ["components", "relationships", "decisions"]) {
    if (!Array.isArray(value[field])) {
      throw invalidSnapshot(`architecture.${field} must be an array.`);
    }
  }

  const components = value.components.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw invalidSnapshot("Architecture components must be objects.");
    }
    const normalized = {
      id: normalizeString(item.id),
      name: normalizeString(item.name),
      type: normalizeString(item.type),
      responsibility: normalizeString(item.responsibility),
      technologyIds: normalizeTextList(item.technologyIds, "architecture component technologyIds"),
    };
    if ([normalized.id, normalized.name, normalized.type, normalized.responsibility].some((field) => typeof field !== "string" || !field)) {
      throw invalidSnapshot("Architecture components require an ID, name, type, and responsibility.");
    }
    return normalized;
  });
  normalizeUniqueIds(components, "architecture.components");
  const componentIds = new Set(components.map((item) => item.id));

  const relationships = value.relationships.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw invalidSnapshot("Architecture relationships must be objects.");
    }
    const normalized = {
      id: normalizeString(item.id),
      sourceId: normalizeString(item.sourceId),
      targetId: normalizeString(item.targetId),
      relationshipType: normalizeString(item.relationshipType),
      description: normalizeString(item.description),
    };
    if ([normalized.id, normalized.sourceId, normalized.targetId, normalized.relationshipType, normalized.description].some((field) => typeof field !== "string" || !field)) {
      throw invalidSnapshot("Architecture relationships require IDs, a type, and a description.");
    }
    if (!componentIds.has(normalized.sourceId) || !componentIds.has(normalized.targetId)) {
      throw invalidSnapshot("Architecture relationships must reference existing components.");
    }
    if (normalized.sourceId === normalized.targetId) {
      throw invalidSnapshot("Architecture relationships cannot connect a component to itself.");
    }
    return normalized;
  });
  normalizeUniqueIds(relationships, "architecture.relationships");

  const decisions = value.decisions.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw invalidSnapshot("Architecture decisions must be objects.");
    }
    const normalized = {
      id: normalizeString(item.id),
      title: normalizeString(item.title),
      decision: normalizeString(item.decision),
      rationale: normalizeString(item.rationale),
      alternatives: normalizeTextList(item.alternatives, "architecture decision alternatives"),
    };
    if ([normalized.id, normalized.title, normalized.decision, normalized.rationale].some((field) => typeof field !== "string" || !field)) {
      throw invalidSnapshot("Architecture decisions require an ID, title, decision, and rationale.");
    }
    return normalized;
  });
  normalizeUniqueIds(decisions, "architecture.decisions");

  if (typeof value.sourceSignature !== "string" || !value.sourceSignature.trim()) {
    throw invalidSnapshot("architecture.sourceSignature must be a non-empty string.");
  }

  return {
    schemaVersion: 1,
    sourceSignature: value.sourceSignature,
    components,
    relationships,
    decisions,
    assumptions: normalizeTextList(value.assumptions, "architecture.assumptions"),
    unresolvedQuestions: normalizeTextList(value.unresolvedQuestions, "architecture.unresolvedQuestions"),
  };
};

const assertAcyclicDependencies = (items, getDependencies, field) => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw invalidSnapshot(`${field} dependencies cannot contain cycles.`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependencyId of getDependencies(byId.get(id))) visit(dependencyId);
    visiting.delete(id);
    visited.add(id);
  };
  for (const item of items) visit(item.id);
};

const normalizeDevelopmentPlan = (value, architecture) => {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidSnapshot("developmentPlan must be an object or null.");
  }
  if (value.schemaVersion !== 1) {
    throw invalidSnapshot("developmentPlan schemaVersion must be 1.");
  }
  for (const field of ["milestones", "phases", "tasks"]) {
    if (!Array.isArray(value[field])) {
      throw invalidSnapshot(`developmentPlan.${field} must be an array.`);
    }
  }

  const milestones = value.milestones.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw invalidSnapshot("Development milestones must be objects.");
    }
    const normalized = {
      id: normalizeString(item.id),
      title: normalizeString(item.title),
      description: normalizeString(item.description),
      completionCriteria: normalizeTextList(item.completionCriteria, "milestone completionCriteria"),
    };
    if ([normalized.id, normalized.title, normalized.description].some((field) => typeof field !== "string" || !field)) {
      throw invalidSnapshot("Development milestones require an ID, title, and description.");
    }
    return normalized;
  });
  normalizeUniqueIds(milestones, "developmentPlan.milestones");
  const milestoneIds = new Set(milestones.map((item) => item.id));

  const phases = value.phases.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw invalidSnapshot("Development phases must be objects.");
    }
    const normalized = {
      id: normalizeString(item.id),
      title: normalizeString(item.title),
      objective: normalizeString(item.objective),
      deliverables: normalizeTextList(item.deliverables, "phase deliverables"),
      dependsOn: normalizeTextList(item.dependsOn, "phase dependsOn"),
      milestoneIds: normalizeTextList(item.milestoneIds, "phase milestoneIds"),
      taskIds: normalizeTextList(item.taskIds, "phase taskIds"),
    };
    if ([normalized.id, normalized.title, normalized.objective].some((field) => typeof field !== "string" || !field)) {
      throw invalidSnapshot("Development phases require an ID, title, and objective.");
    }
    return normalized;
  });
  normalizeUniqueIds(phases, "developmentPlan.phases");
  const phaseIds = new Set(phases.map((item) => item.id));
  for (const phase of phases) {
    if (phase.dependsOn.some((id) => !phaseIds.has(id)) || phase.dependsOn.includes(phase.id)) {
      throw invalidSnapshot("Development phase dependencies must reference other existing phases.");
    }
    if (phase.milestoneIds.some((id) => !milestoneIds.has(id))) {
      throw invalidSnapshot("Development phases must reference existing milestones.");
    }
  }
  assertAcyclicDependencies(phases, (phase) => phase.dependsOn, "Development phase");

  const tasks = value.tasks.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw invalidSnapshot("Development tasks must be objects.");
    }
    const normalized = {
      id: normalizeString(item.id),
      title: normalizeString(item.title),
      description: normalizeString(item.description),
      phaseId: normalizeString(item.phaseId),
      componentIds: normalizeTextList(item.componentIds, "task componentIds"),
      dependsOn: normalizeTextList(item.dependsOn, "task dependsOn"),
      acceptanceCriteria: normalizeTextList(item.acceptanceCriteria, "task acceptanceCriteria"),
      deliverables: normalizeTextList(item.deliverables, "task deliverables"),
      suggestedTests: normalizeTextList(item.suggestedTests, "task suggestedTests"),
      learningResources: normalizeTextList(item.learningResources, "task learningResources"),
    };
    if ([normalized.id, normalized.title, normalized.description, normalized.phaseId].some((field) => typeof field !== "string" || !field)) {
      throw invalidSnapshot("Development tasks require an ID, title, description, and phase ID.");
    }
    return normalized;
  });
  normalizeUniqueIds(tasks, "developmentPlan.tasks");
  const taskIds = new Set(tasks.map((item) => item.id));
  const architectureComponentIds = new Set((architecture?.components || []).map((item) => item.id));
  for (const task of tasks) {
    if (!phaseIds.has(task.phaseId)) {
      throw invalidSnapshot("Development tasks must reference an existing phase.");
    }
    if (task.dependsOn.some((id) => !taskIds.has(id)) || task.dependsOn.includes(task.id)) {
      throw invalidSnapshot("Development task dependencies must reference other existing tasks.");
    }
    if (task.componentIds.some((id) => !architectureComponentIds.has(id))) {
      throw invalidSnapshot("Development tasks must reference existing architecture components.");
    }
  }
  assertAcyclicDependencies(tasks, (task) => task.dependsOn, "Development task");

  for (const phase of phases) {
    if (phase.taskIds.some((id) => !taskIds.has(id))) {
      throw invalidSnapshot("Development phases must reference existing tasks.");
    }
  }

  if (typeof value.sourceSignature !== "string" || !value.sourceSignature.trim()) {
    throw invalidSnapshot("developmentPlan.sourceSignature must be a non-empty string.");
  }

  return { schemaVersion: 1, sourceSignature: value.sourceSignature, milestones, phases, tasks };
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

  for (const architectureComponent of snapshot.architecture?.components || []) {
    for (const technologyId of architectureComponent.technologyIds) {
      if (!componentIds.has(technologyId)) {
        errors.push(`Unknown architecture technology ID: ${technologyId}.`);
      }
    }
  }

  return errors;
};

/** Convert legacy V1 snapshots to the canonical V2 shape without losing decisions. */
export const migrateProjectSnapshot = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw invalidSnapshot("Project snapshot must be an object.");
  }
  if (input.schemaVersion === LEGACY_PROJECT_SNAPSHOT_VERSION) {
    return {
      ...input,
      schemaVersion: PROJECT_SNAPSHOT_VERSION,
      architecture: null,
      developmentPlan: null,
    };
  }
  if (input.schemaVersion === PROJECT_SNAPSHOT_VERSION) return input;
  throw unsupportedVersion(input.schemaVersion);
};

export const normalizeProjectSnapshot = (input = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw invalidSnapshot("Project snapshot must be an object.");
  }

  const version = input.schemaVersion ?? LEGACY_PROJECT_SNAPSHOT_VERSION;
  assertSupportedVersion(version);
  const migrated = migrateProjectSnapshot({ ...input, schemaVersion: version });
  const projectDefinition = normalizeProjectDefinition(migrated.projectDefinition);
  const selectedComponentIds = normalizeTextList(migrated.selectedComponentIds, "selectedComponentIds");
  const activeRecipeId =
    migrated.activeRecipeId === null || migrated.activeRecipeId === undefined
      ? null
      : normalizeString(migrated.activeRecipeId);

  if (activeRecipeId !== null && (typeof activeRecipeId !== "string" || !activeRecipeId)) {
    throw invalidSnapshot("activeRecipeId must be a non-empty string or null.");
  }

  const architecture = normalizeArchitecture(migrated.architecture);
  const developmentPlan = normalizeDevelopmentPlan(migrated.developmentPlan, architecture);

  return {
    schemaVersion: PROJECT_SNAPSHOT_VERSION,
    projectDefinition,
    selectedComponentIds,
    activeRecipeId,
    architecture,
    developmentPlan,
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
    architecture: normalized.architecture,
    development_plan: normalized.developmentPlan,
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

  if (record.schema_version === PROJECT_SNAPSHOT_VERSION) {
    const missingV2Keys = ["architecture", "development_plan"].filter((key) => !(key in record));
    if (missingV2Keys.length > 0) {
      throw invalidRecord(`Persisted V2 project record is missing fields: ${missingV2Keys.join(", ")}.`);
    }
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
      ...(record.schema_version === PROJECT_SNAPSHOT_VERSION
        ? { architecture: record.architecture, developmentPlan: record.development_plan }
        : {}),
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
