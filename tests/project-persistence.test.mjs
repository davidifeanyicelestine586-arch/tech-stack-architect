import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  PersistenceError,
  deserializeProjectRecord,
  normalizeProjectSnapshot,
  serializeProjectSnapshot,
  validateProjectSnapshot,
} from "../lib/persistence/project-serialization.js";

const readJson = (path) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));

const registries = {
  domains: readJson("../data/domain.json"),
  components: readJson("../data/components.json"),
  recipes: readJson("../data/recipes.json"),
};

const baseSnapshot = () => ({
  schemaVersion: 1,
  projectDefinition: {
    name: "  AI Document Q&A Platform  ",
    description: "  A SaaS application for document questions.  ",
    domain: "web-saas",
    difficulty: "Intermediate",
    requirements: "  upload PDFs, ask questions, deploy  ",
  },
  selectedComponentIds: [" nextjs ", "nodejs", "nextjs", "vercel"],
  activeRecipeId: "bootstrapped-payment-dashboard",
});

const baseRecord = () => ({
  id: "3a7f6dd5-6517-4b74-b4d4-8c3e4a5db19e",
  name: "AI Document Q&A Platform",
  description: "A SaaS application for document questions.",
  domain_id: "web-saas",
  difficulty: "Intermediate",
  requirements: "upload PDFs, ask questions, deploy",
  selected_component_ids: ["nextjs", "nodejs", "vercel"],
  active_recipe_id: "bootstrapped-payment-dashboard",
  schema_version: 1,
  revision: 3,
  created_at: "2026-08-24T12:00:00.000Z",
  updated_at: "2026-08-24T12:05:00.000Z",
});

test("valid snapshot serialization emits only canonical persisted fields", () => {
  const serialized = serializeProjectSnapshot(baseSnapshot(), registries);

  assert.deepEqual(serialized, {
    schema_version: 1,
    name: "AI Document Q&A Platform",
    description: "A SaaS application for document questions.",
    domain_id: "web-saas",
    difficulty: "Intermediate",
    requirements: "upload PDFs, ask questions, deploy",
    selected_component_ids: ["nextjs", "nodejs", "vercel"],
    active_recipe_id: "bootstrapped-payment-dashboard",
  });
});

test("valid persisted records deserialize to saved metadata plus a canonical snapshot", () => {
  const record = deserializeProjectRecord(baseRecord(), registries);

  assert.deepEqual(record, {
    id: "3a7f6dd5-6517-4b74-b4d4-8c3e4a5db19e",
    schemaVersion: 1,
    revision: 3,
    createdAt: "2026-08-24T12:00:00.000Z",
    updatedAt: "2026-08-24T12:05:00.000Z",
    snapshot: {
      schemaVersion: 1,
      projectDefinition: {
        name: "AI Document Q&A Platform",
        description: "A SaaS application for document questions.",
        domain: "web-saas",
        difficulty: "Intermediate",
        requirements: "upload PDFs, ask questions, deploy",
      },
      selectedComponentIds: ["nextjs", "nodejs", "vercel"],
      activeRecipeId: "bootstrapped-payment-dashboard",
    },
  });
});

test("snapshot serialization and deserialization preserve the canonical state", () => {
  const serialized = serializeProjectSnapshot(baseSnapshot(), registries);
  const restored = deserializeProjectRecord(
    {
      ...baseRecord(),
      name: serialized.name,
      description: serialized.description,
      domain_id: serialized.domain_id,
      difficulty: serialized.difficulty,
      requirements: serialized.requirements,
      selected_component_ids: serialized.selected_component_ids,
      active_recipe_id: serialized.active_recipe_id,
      schema_version: serialized.schema_version,
    },
    registries
  );

  assert.deepEqual(restored.snapshot, normalizeProjectSnapshot(baseSnapshot()));
});

test("text values are trimmed consistently with the existing project workflow", () => {
  const normalized = normalizeProjectSnapshot(baseSnapshot());

  assert.equal(normalized.projectDefinition.name, "AI Document Q&A Platform");
  assert.equal(
    normalized.projectDefinition.description,
    "A SaaS application for document questions."
  );
  assert.equal(normalized.projectDefinition.domain, "web-saas");
  assert.equal(normalized.projectDefinition.requirements, "upload PDFs, ask questions, deploy");
});

test("duplicate component IDs are normalized in first-seen order", () => {
  const normalized = normalizeProjectSnapshot({
    ...baseSnapshot(),
    selectedComponentIds: ["nodejs", "nextjs", "nodejs", "vercel", "nextjs"],
  });

  assert.deepEqual(normalized.selectedComponentIds, ["nodejs", "nextjs", "vercel"]);
});

test("empty project names are rejected", () => {
  assert.throws(
    () => normalizeProjectSnapshot({
      ...baseSnapshot(),
      projectDefinition: { ...baseSnapshot().projectDefinition, name: "   " },
    }),
    (error) =>
      error instanceof PersistenceError &&
      error.code === "INVALID_SNAPSHOT" &&
      error.details.errors.includes("Project name is required.")
  );
});

test("empty project descriptions are rejected", () => {
  assert.throws(
    () => normalizeProjectSnapshot({
      ...baseSnapshot(),
      projectDefinition: {
        ...baseSnapshot().projectDefinition,
        description: "   ",
      },
    }),
    (error) =>
      error instanceof PersistenceError &&
      error.code === "INVALID_SNAPSHOT" &&
      error.details.errors.includes("Project description is required.")
  );
});

test("invalid difficulty values are rejected", () => {
  assert.throws(
    () => normalizeProjectSnapshot({
      ...baseSnapshot(),
      projectDefinition: {
        ...baseSnapshot().projectDefinition,
        difficulty: "Expert",
      },
    }),
    (error) => error instanceof PersistenceError && error.code === "INVALID_SNAPSHOT"
  );
});

test("unknown domain IDs are rejected", () => {
  const result = validateProjectSnapshot(
    {
      ...baseSnapshot(),
      projectDefinition: {
        ...baseSnapshot().projectDefinition,
        domain: "unknown-domain",
      },
    },
    registries
  );

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["Unknown domain ID: unknown-domain."]);
});

test("unknown component IDs are rejected", () => {
  const result = validateProjectSnapshot(
    { ...baseSnapshot(), selectedComponentIds: ["nextjs", "unknown-component"] },
    registries
  );

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["Unknown component ID: unknown-component."]);
});

test("unknown recipe IDs are rejected", () => {
  const result = validateProjectSnapshot(
    { ...baseSnapshot(), activeRecipeId: "unknown-recipe" },
    registries
  );

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["Unknown recipe ID: unknown-recipe."]);
});

test("unsupported schema versions are rejected", () => {
  assert.throws(
    () => deserializeProjectRecord({ ...baseRecord(), schema_version: 2 }, registries),
    (error) =>
      error instanceof PersistenceError &&
      error.code === "UNSUPPORTED_SCHEMA_VERSION"
  );
});

test("derived state is excluded from serialized output", () => {
  const input = {
    ...baseSnapshot(),
    requirementAnalysis: { recommendations: ["must not persist"] },
    validationReport: { score: 100 },
    blueprint: { title: "must not persist" },
    mergedReport: { status: "must not persist" },
    searchQuery: "must not persist",
    activeTab: "must not persist",
    ignoredRecommendationIds: ["must-not-persist"],
  };
  const serialized = serializeProjectSnapshot(input, registries);

  assert.deepEqual(Object.keys(serialized).sort(), [
    "active_recipe_id",
    "description",
    "difficulty",
    "domain_id",
    "name",
    "requirements",
    "schema_version",
    "selected_component_ids",
  ]);
  assert.equal("requirementAnalysis" in serialized, false);
  assert.equal("validationReport" in serialized, false);
  assert.equal("blueprint" in serialized, false);
});

test("server metadata cannot be supplied as mutable project state", () => {
  const serialized = serializeProjectSnapshot(
    {
      ...baseSnapshot(),
      id: "client-controlled-id",
      revision: 999,
      createdAt: "client-controlled-created-at",
      updatedAt: "client-controlled-updated-at",
      ownerId: "client-controlled-owner",
    },
    registries
  );

  assert.equal("id" in serialized, false);
  assert.equal("revision" in serialized, false);
  assert.equal("createdAt" in serialized, false);
  assert.equal("updatedAt" in serialized, false);
  assert.equal("ownerId" in serialized, false);
});

test("malformed persisted records are rejected safely", () => {
  assert.throws(
    () =>
      deserializeProjectRecord(
        { ...baseRecord(), selected_component_ids: "nextjs" },
        registries
      ),
    (error) => error instanceof PersistenceError && error.code === "INVALID_RECORD"
  );

  assert.throws(
    () => {
      const malformed = { ...baseRecord() };
      delete malformed.updated_at;
      deserializeProjectRecord(malformed, registries);
    },
    (error) => error instanceof PersistenceError && error.code === "INVALID_RECORD"
  );

  assert.throws(
    () =>
      deserializeProjectRecord(
        { ...baseRecord(), blueprint: { title: "derived" } },
        registries
      ),
    (error) => error instanceof PersistenceError && error.code === "INVALID_RECORD"
  );
});
