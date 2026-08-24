import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import RequirementAnalyzer from "../engine/requirementAnalyzer.js";
import { createProviderPersistenceController } from "../lib/persistence/client/provider-persistence.js";
import { ProjectPersistenceApiError } from "../lib/persistence/client/project-persistence-client.js";

const readJson = (path) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));

const registries = {
  domains: readJson("../data/domain.json"),
  components: readJson("../data/components.json"),
  recipes: readJson("../data/recipes.json"),
};
const analyzer = new RequirementAnalyzer(registries);

const serverProjectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const serverProjectIdTwo = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const baseSnapshot = () => ({
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
});

const clone = (value) => JSON.parse(JSON.stringify(value));

class FakePersistenceClient {
  constructor() {
    this.records = new Map();
    this.nextId = 0;
    this.failWith = null;
  }

  makeId() {
    this.nextId += 1;
    return this.nextId === 1 ? serverProjectId : serverProjectIdTwo;
  }

  maybeFail() {
    if (this.failWith) throw this.failWith;
  }

  async create(snapshot) {
    this.maybeFail();
    const record = {
      id: this.makeId(),
      revision: 1,
      createdAt: "2026-08-24T12:00:00.000Z",
      updatedAt: "2026-08-24T12:00:00.000Z",
      snapshot: clone(snapshot),
    };
    this.records.set(record.id, record);
    return clone(record);
  }

  async update(id, snapshot, expectedRevision) {
    this.maybeFail();
    const record = this.records.get(id);
    if (!record) {
      throw new ProjectPersistenceApiError("PERSISTENCE_NOT_FOUND", "Project not found.");
    }
    if (record.revision !== expectedRevision) {
      throw new ProjectPersistenceApiError("PERSISTENCE_CONFLICT", "Project changed elsewhere.");
    }
    record.revision += 1;
    record.updatedAt = "2026-08-24T12:10:00.000Z";
    record.snapshot = clone(snapshot);
    return clone(record);
  }

  async get(id) {
    this.maybeFail();
    const record = this.records.get(id);
    if (!record) {
      throw new ProjectPersistenceApiError("PERSISTENCE_NOT_FOUND", "Project not found.");
    }
    return clone(record);
  }

  async list() {
    this.maybeFail();
    return [...this.records.values()].map((record) => ({
      id: record.id,
      revision: record.revision,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      name: record.snapshot.projectDefinition.name,
      description: record.snapshot.projectDefinition.description,
      domain: record.snapshot.projectDefinition.domain,
      difficulty: record.snapshot.projectDefinition.difficulty,
    }));
  }

  async remove(id) {
    this.maybeFail();
    if (!this.records.delete(id)) {
      throw new ProjectPersistenceApiError("PERSISTENCE_NOT_FOUND", "Project not found.");
    }
    return true;
  }
}

const createHarness = (client = new FakePersistenceClient()) => {
  const state = {
    canonical: baseSnapshot(),
    identity: { id: null, revision: null },
    status: "idle",
    error: null,
    derived: null,
    appliedRecord: null,
  };

  const controller = createProviderPersistenceController({
    client,
    registries,
    getCanonicalSnapshot: () => clone(state.canonical),
    getCurrentProjectIdentity: () => ({ ...state.identity }),
    setPersistenceStatus: (status) => {
      state.status = status;
    },
    setPersistenceError: (error) => {
      state.error = error;
    },
    applyLoadedProject: ({ record, snapshot }) => {
      state.canonical = clone(snapshot);
      state.appliedRecord = clone(record);
      state.derived = analyzer.analyze(snapshot.projectDefinition);
      state.identity = { id: record.id, revision: record.revision };
    },
    applySavedIdentity: (record) => {
      state.identity = { id: record.id, revision: record.revision };
    },
    clearDeletedIdentity: (id) => {
      if (state.identity.id === id) state.identity = { id: null, revision: null };
    },
  });

  return { client, state, controller };
};

test("saveProject saves a new project and receives server-owned identity", async () => {
  const harness = createHarness();
  await harness.controller.saveProject();

  assert.equal(harness.state.identity.id, serverProjectId);
  assert.equal(harness.state.identity.revision, 1);
  assert.equal(harness.state.status, "saved");
  assert.equal(harness.state.error, null);
});

test("saveProject updates an existing project with the current revision", async () => {
  const harness = createHarness();
  await harness.controller.saveProject();
  harness.state.canonical.projectDefinition.name = "Updated Project";
  await harness.controller.saveProject();

  assert.equal(harness.state.identity.id, serverProjectId);
  assert.equal(harness.state.identity.revision, 2);
  assert.equal(harness.client.records.get(serverProjectId).snapshot.projectDefinition.name, "Updated Project");
});

test("saveProject stores only the server response ID and revision", async () => {
  const harness = createHarness();
  harness.state.canonical.clientControlledId = "do-not-trust";
  harness.state.canonical.clientControlledRevision = 999;
  await harness.controller.saveProject();

  assert.equal(harness.state.identity.id, serverProjectId);
  assert.equal(harness.state.identity.revision, 1);
  assert.notEqual(harness.state.identity.id, harness.state.canonical.clientControlledId);
  assert.notEqual(harness.state.identity.revision, harness.state.canonical.clientControlledRevision);
});

test("loadProject restores canonical state and server identity", async () => {
  const harness = createHarness();
  const saved = await harness.client.create({
    ...baseSnapshot(),
    projectDefinition: { ...baseSnapshot().projectDefinition, name: "Persisted Project" },
  });
  harness.state.canonical = baseSnapshot({
    projectDefinition: { ...baseSnapshot().projectDefinition, name: "Local Draft" },
  });

  await harness.controller.loadProject(saved.id);

  assert.equal(harness.state.canonical.projectDefinition.name, "Persisted Project");
  assert.deepEqual(harness.state.canonical.selectedComponentIds, saved.snapshot.selectedComponentIds);
  assert.equal(harness.state.canonical.activeRecipeId, saved.snapshot.activeRecipeId);
  assert.equal(harness.state.identity.id, saved.id);
  assert.equal(harness.state.identity.revision, saved.revision);
  assert.equal(harness.state.status, "saved");
});

test("loadProject hydrates only canonical state and discards persisted derived fields", async () => {
  const harness = createHarness();
  const saved = await harness.client.create(baseSnapshot());
  saved.snapshot.requirementAnalysis = { recommendations: ["stale"] };
  saved.snapshot.validationReport = { score: 0 };
  saved.snapshot.blueprint = { title: "stale" };
  harness.client.records.set(saved.id, saved);

  await harness.controller.loadProject(saved.id);

  assert.equal("requirementAnalysis" in harness.state.canonical, false);
  assert.equal("validationReport" in harness.state.canonical, false);
  assert.equal("blueprint" in harness.state.canonical, false);
  assert.equal(harness.state.derived === null, false);
});

test("loadProject recomputes derived analysis through the existing deterministic engine", async () => {
  const harness = createHarness();
  const saved = await harness.client.create(baseSnapshot());

  await harness.controller.loadProject(saved.id);

  assert.ok(harness.state.derived);
  assert.equal(harness.state.derived.project.name, baseSnapshot().projectDefinition.name);
  assert.ok(harness.state.derived.recommendations.length > 0);
  assert.equal(
    harness.state.derived.recommendations.some(
      (recommendation) => recommendation.component.id === "nextjs"
    ),
    true
  );
});

test("listProjects returns safe project summaries without session identifiers", async () => {
  const harness = createHarness();
  await harness.client.create(baseSnapshot());
  const projects = await harness.controller.listProjects();

  assert.equal(projects.length, 1);
  assert.equal(projects[0].id, serverProjectId);
  assert.equal(projects[0].name, baseSnapshot().projectDefinition.name);
  assert.equal("sessionId" in projects[0], false);
  assert.equal("anonymous_session_id" in projects[0], false);
  assert.equal(harness.state.status, "idle");
});

test("deleteProject removes the project through the API client", async () => {
  const harness = createHarness();
  const saved = await harness.client.create(baseSnapshot());

  await harness.controller.deleteProject(saved.id);

  assert.equal(harness.client.records.has(saved.id), false);
  assert.equal(harness.state.status, "idle");
});

test("deleteProject clears identity only when deleting the current project", async () => {
  const harness = createHarness();
  await harness.controller.saveProject();
  const currentId = harness.state.identity.id;
  const other = await harness.client.create(baseSnapshot());

  await harness.controller.deleteProject(other.id);
  assert.deepEqual(harness.state.identity, { id: currentId, revision: 1 });

  await harness.controller.deleteProject(currentId);
  assert.deepEqual(harness.state.identity, { id: null, revision: null });
});

test("save conflict preserves the current in-memory project state", async () => {
  const harness = createHarness();
  await harness.controller.saveProject();
  const before = clone(harness.state.canonical);
  harness.state.canonical.projectDefinition.name = "Unsaved Local Edit";
  harness.client.records.get(serverProjectId).revision = 2;

  await assert.rejects(() => harness.controller.saveProject(), (error) => {
    assert.equal(error.code, "PERSISTENCE_CONFLICT");
    return true;
  });
  assert.equal(harness.state.canonical.projectDefinition.name, "Unsaved Local Edit");
  assert.notDeepEqual(harness.state.canonical, before);
  assert.equal(harness.state.status, "error");
  assert.equal(harness.state.error.code, "PERSISTENCE_CONFLICT");
});

test("save failure preserves the current in-memory project state", async () => {
  const client = new FakePersistenceClient();
  const harness = createHarness(client);
  harness.state.canonical.projectDefinition.name = "Local Draft";
  client.failWith = new ProjectPersistenceApiError("PERSISTENCE_UNAVAILABLE", "offline");

  await assert.rejects(() => harness.controller.saveProject(), (error) => {
    assert.equal(error.code, "PERSISTENCE_UNAVAILABLE");
    return true;
  });
  assert.equal(harness.state.canonical.projectDefinition.name, "Local Draft");
  assert.deepEqual(harness.state.identity, { id: null, revision: null });
  assert.equal(harness.state.status, "error");
});

test("load failure leaves the current project state unchanged", async () => {
  const client = new FakePersistenceClient();
  const harness = createHarness(client);
  harness.state.canonical.projectDefinition.name = "Current Draft";
  client.failWith = new ProjectPersistenceApiError("PERSISTENCE_UNAVAILABLE", "offline");

  await assert.rejects(() => harness.controller.loadProject(serverProjectId), (error) => {
    assert.equal(error.code, "PERSISTENCE_UNAVAILABLE");
    return true;
  });
  assert.equal(harness.state.canonical.projectDefinition.name, "Current Draft");
  assert.deepEqual(harness.state.identity, { id: null, revision: null });
  assert.equal(harness.state.status, "error");
});

test("invalid server payload is rejected before canonical hydration", async () => {
  const client = new FakePersistenceClient();
  const harness = createHarness(client);
  const before = clone(harness.state.canonical);
  client.get = async () => ({
    id: serverProjectId,
    revision: 1,
    createdAt: "2026-08-24T12:00:00.000Z",
    updatedAt: "2026-08-24T12:00:00.000Z",
    snapshot: { schemaVersion: 1, projectDefinition: null },
  });

  await assert.rejects(() => harness.controller.loadProject(serverProjectId), (error) => {
    assert.equal(error.code, "MALFORMED_RECORD");
    return true;
  });
  assert.deepEqual(harness.state.canonical, before);
});

test("server-owned project ID cannot be overridden by client state", async () => {
  const harness = createHarness();
  harness.state.canonical.clientControlledId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  await harness.controller.saveProject();

  assert.equal(harness.state.identity.id, serverProjectId);
  assert.equal(harness.state.identity.id === harness.state.canonical.clientControlledId, false);
});

test("server-owned revision cannot be overridden by client state", async () => {
  const harness = createHarness();
  harness.state.identity = { id: null, revision: 999 };
  await harness.controller.saveProject();

  assert.equal(harness.state.identity.revision, 1);
  assert.equal(harness.state.identity.revision === 999, false);
});
