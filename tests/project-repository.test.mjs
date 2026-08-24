import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ProjectRepository } from "../lib/persistence/repository/project-repository.js";
import { ProjectPersistenceService } from "../lib/persistence/service/project-persistence-service.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";

const readJson = (path) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));

const registries = {
  domains: readJson("../data/domain.json"),
  components: readJson("../data/components.json"),
  recipes: readJson("../data/recipes.json"),
};

const sessionA = {
  kind: "anonymous",
  sessionId: "11111111-1111-4111-8111-111111111111",
};
const sessionB = {
  kind: "anonymous",
  sessionId: "22222222-2222-4222-8222-222222222222",
};
const baseSnapshot = (overrides = {}) => ({
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
  ...overrides,
});

const clone = (value) => JSON.parse(JSON.stringify(value));

class FakeQuery {
  constructor(database, operation = "select", payload = null) {
    this.database = database;
    this.operation = operation;
    this.payload = payload;
    this.filters = [];
    this.orderBy = null;
  }

  insert(payload) {
    this.operation = "insert";
    this.payload = clone(payload);
    return this;
  }

  update(payload) {
    this.operation = "update";
    this.payload = clone(payload);
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  select() {
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  is(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  order(column, options) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  single() {
    return this.execute("single");
  }

  maybeSingle() {
    return this.execute("maybeSingle");
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute(mode = "many") {
    if (this.database.failWith) {
      throw this.database.failWith;
    }

    if (this.operation === "insert") {
      const row = {
        ...clone(this.payload),
        id: this.database.nextId(),
        revision: 1,
        created_at: "2026-08-24T12:00:00.000Z",
        updated_at: "2026-08-24T12:00:00.000Z",
      };
      this.database.rows.push(row);
      return { data: clone(row), error: null };
    }

    const matching = this.database.rows.filter((row) =>
      this.filters.every((filter) => filter(row))
    );

    if (this.operation === "update") {
      matching.forEach((row) => Object.assign(row, clone(this.payload)));
      matching.forEach((row) => {
        row.updated_at = "2026-08-24T12:10:00.000Z";
      });
    }

    if (this.operation === "delete") {
      this.database.rows = this.database.rows.filter(
        (row) => !matching.includes(row)
      );
      return { data: clone(matching.map(({ id }) => ({ id }))), error: null };
    }

    let result = matching.map(clone);
    if (this.orderBy) {
      result.sort((left, right) =>
        this.orderBy.ascending
          ? left[this.orderBy.column].localeCompare(right[this.orderBy.column])
          : right[this.orderBy.column].localeCompare(left[this.orderBy.column])
      );
    }

    if (mode === "single") {
      if (result.length !== 1) {
        return {
          data: result[0] || null,
          error: result.length === 0 ? new Error("No rows") : new Error("Multiple rows"),
        };
      }
      return { data: result[0], error: null };
    }

    if (mode === "maybeSingle") {
      return { data: result[0] || null, error: null };
    }

    return { data: result, error: null };
  }
}

class FakeSupabase {
  constructor(rows = []) {
    this.rows = rows;
    this.counter = 0;
    this.failWith = null;
  }

  nextId() {
    this.counter += 1;
    return `00000000-0000-4000-8000-${String(this.counter).padStart(12, "0")}`;
  }

  from() {
    return new FakeQuery(this);
  }
}

const createRepository = (client = new FakeSupabase()) =>
  new ProjectRepository({ client, registries });

test("repository create persists the validated canonical snapshot in a scoped row", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);
  const record = await repository.createProject({
    scope: sessionA,
    snapshot: baseSnapshot(),
  });

  assert.equal(record.snapshot.projectDefinition.name, "AI Document Q&A Platform");
  assert.deepEqual(record.snapshot.selectedComponentIds, ["nextjs", "nodejs", "vercel"]);
  assert.equal(record.revision, 1);
  assert.equal(client.rows[0].anonymous_session_id, sessionA.sessionId);
  assert.equal(client.rows[0].owner_id, null);
  assert.equal("validationReport" in client.rows[0], false);
});

test("repository get loads only the project in the supplied scope", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);
  const created = await repository.createProject({ scope: sessionA, snapshot: baseSnapshot() });

  const loaded = await repository.getProject({ scope: sessionA, id: created.id });
  assert.deepEqual(loaded.snapshot, created.snapshot);

  await assert.rejects(
    () => repository.getProject({ scope: sessionB, id: created.id }),
    (error) => error instanceof PersistenceError && error.code === "PERSISTENCE_NOT_FOUND"
  );
});

test("repository list returns only scoped projects in updated order", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);
  await repository.createProject({ scope: sessionA, snapshot: baseSnapshot() });
  const second = await repository.createProject({
    scope: sessionA,
    snapshot: baseSnapshot({
      projectDefinition: {
        ...baseSnapshot().projectDefinition,
        name: "Second Project",
      },
    }),
  });
  await repository.createProject({ scope: sessionB, snapshot: baseSnapshot() });
  client.rows.find((row) => row.id === second.id).updated_at = "2026-08-24T12:20:00.000Z";

  const projects = await repository.listProjects({ scope: sessionA });
  assert.equal(projects.length, 2);
  assert.equal(projects[0].id, second.id);
  assert.ok(projects.every((project) => project.snapshot.projectDefinition.name !== "Other Session"));
});

test("repository update uses optimistic revision protection", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);
  const created = await repository.createProject({ scope: sessionA, snapshot: baseSnapshot() });
  const updated = await repository.updateProject({
    scope: sessionA,
    id: created.id,
    expectedRevision: 1,
    snapshot: baseSnapshot({
      projectDefinition: {
        ...baseSnapshot().projectDefinition,
        name: "Updated Project",
      },
    }),
  });

  assert.equal(updated.snapshot.projectDefinition.name, "Updated Project");
  assert.equal(updated.revision, 2);

  await assert.rejects(
    () =>
      repository.updateProject({
        scope: sessionA,
        id: created.id,
        expectedRevision: 1,
        snapshot: baseSnapshot(),
      }),
    (error) => error instanceof PersistenceError && error.code === "PERSISTENCE_CONFLICT"
  );
});

test("repository delete removes only the scoped project", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);
  const first = await repository.createProject({ scope: sessionA, snapshot: baseSnapshot() });
  const second = await repository.createProject({ scope: sessionB, snapshot: baseSnapshot() });

  assert.equal(await repository.deleteProject({ scope: sessionA, id: first.id }), true);
  assert.equal(client.rows.length, 1);
  assert.equal(client.rows[0].id, second.id);

  await assert.rejects(
    () => repository.deleteProject({ scope: sessionA, id: first.id }),
    (error) => error instanceof PersistenceError && error.code === "PERSISTENCE_NOT_FOUND"
  );
});

test("invalid scopes and project IDs are rejected as unauthorized", async () => {
  const repository = createRepository();

  await assert.rejects(
    () => repository.listProjects({ scope: { kind: "anonymous", sessionId: "not-a-uuid" } }),
    (error) => error instanceof PersistenceError && error.code === "UNAUTHORIZED"
  );
  await assert.rejects(
    () => repository.getProject({ scope: sessionA, id: "not-a-uuid" }),
    (error) => error instanceof PersistenceError && error.code === "UNAUTHORIZED"
  );
});

test("repository rejects invalid snapshots before calling the database", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);

  await assert.rejects(
    () =>
      repository.createProject({
        scope: sessionA,
        snapshot: baseSnapshot({
          projectDefinition: {
            ...baseSnapshot().projectDefinition,
            name: "",
          },
        }),
      }),
    (error) =>
      error instanceof PersistenceError &&
      error.code === "VALIDATION_FAILURE" &&
      error.details.errors.includes("Project name is required.")
  );
  assert.equal(client.rows.length, 0);
});

test("repository maps database failures to typed errors without leaking raw errors", async () => {
  const client = new FakeSupabase();
  const rawError = new Error("connection string and secret must not escape");
  client.failWith = rawError;
  const repository = createRepository(client);

  await assert.rejects(
    () => repository.listProjects({ scope: sessionA }),
    (error) => {
      assert.equal(error instanceof PersistenceError, true);
      assert.equal(error.code, "DATABASE_FAILURE");
      assert.equal(error.message, "Unable to list project.");
      assert.equal(error.internal.cause, rawError);
      assert.equal(error.details.errors.includes(rawError.message), false);
      return true;
    }
  );
});

test("service delegates CRUD through the repository boundary", async () => {
  const repository = createRepository();
  const service = new ProjectPersistenceService({ repository });
  const created = await service.createProject({ scope: sessionA, snapshot: baseSnapshot() });
  const listed = await service.listProjects({ scope: sessionA });
  const loaded = await service.getProject({ scope: sessionA, id: created.id });

  assert.equal(listed.length, 1);
  assert.equal(loaded.id, created.id);
  assert.equal(await service.deleteProject({ scope: sessionA, id: created.id }), true);
});

test("repository deserializes the stored row and validates registry references", async () => {
  const client = new FakeSupabase();
  const repository = createRepository(client);
  const created = await repository.createProject({ scope: sessionA, snapshot: baseSnapshot() });
  const stored = client.rows.find((row) => row.id === created.id);
  stored.selected_component_ids = ["unknown-component"];

  await assert.rejects(
    () => repository.getProject({ scope: sessionA, id: created.id }),
    (error) => error instanceof PersistenceError && error.code === "MALFORMED_RECORD"
  );
});

test("repository maps malformed database rows safely", async () => {
  const malformedRow = {
    id: "00000000-0000-4000-8000-000000000001",
    owner_id: null,
    anonymous_session_id: sessionA.sessionId,
    name: "Malformed",
    description: "Record",
    domain_id: "web-saas",
    difficulty: "Intermediate",
    requirements: "",
    selected_component_ids: ["nextjs"],
    active_recipe_id: null,
    schema_version: 1,
    revision: 0,
    created_at: "2026-08-24T12:00:00.000Z",
    updated_at: "2026-08-24T12:00:00.000Z",
  };
  const repository = createRepository(new FakeSupabase([malformedRow]));

  await assert.rejects(
    () => repository.getProject({ scope: sessionA, id: malformedRow.id }),
    (error) => error instanceof PersistenceError && error.code === "MALFORMED_RECORD"
  );
});
