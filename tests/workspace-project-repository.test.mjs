import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { ProjectRepository } from "../lib/persistence/repository/project-repository.js";
import { PersistenceError, serializeProjectSnapshot } from "../lib/persistence/project-serialization.js";

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));
const registries = {
  domains: readJson("../data/domain.json"),
  components: readJson("../data/components.json"),
  recipes: readJson("../data/recipes.json"),
};
const scope = {
  kind: "workspace",
  userId: "22222222-2222-4222-8222-222222222222",
  workspaceId: "33333333-3333-4333-8333-333333333333",
};
const row = {
  id: "44444444-4444-4444-8444-444444444444",
  owner_id: "55555555-5555-4555-8555-555555555555",
  workspace_id: scope.workspaceId,
  visibility: "private",
};

const createClient = ({ workspaceRole = "member", projectRole = null, workspaceStatus = "active", projectRow = null } = {}) => {
  const calls = { rpc: [], tables: [] };
  return {
  calls,
  from(table) {
    calls.tables.push(table);
    const filters = {};
    return {
      select() { return this; },
      eq(column, value) { filters[column] = value; return this; },
      async maybeSingle() {
        if (table === "projects") return { data: projectRow, error: null };
        if (table === "workspaces") return { data: { status: workspaceStatus }, error: null };
        if (table === "workspace_memberships") {
          return { data: filters.user_id === scope.userId && filters.workspace_id === scope.workspaceId ? { role: workspaceRole } : null, error: null };
        }
        if (table === "project_memberships") {
          return { data: filters.user_id === scope.userId && filters.project_id === row.id && projectRole ? { role: projectRole } : null, error: null };
        }
        return { data: null, error: null };
      },
    };
  },
  async rpc(name, args) {
    calls.rpc.push({ name, args });
    return {
      data: [{
        ...projectRow,
        ...args.p_snapshot,
        visibility: args.p_visibility ?? projectRow.visibility,
        revision: projectRow.revision + 1,
        updated_at: "2026-11-23T12:00:00.000Z",
      }],
      error: null,
    };
  },
};
};

test("repository rejects project access when the actor is not a workspace member", async () => {
  const repository = new ProjectRepository({ client: createClient({ workspaceRole: null }), registries: {} });
  await assert.rejects(
    repository.assertProjectAccess(row, scope, "read"),
    (error) => error instanceof PersistenceError && error.code === "FORBIDDEN",
  );
});

test("repository rejects private project access without a project grant", async () => {
  const repository = new ProjectRepository({ client: createClient({ workspaceRole: "member" }), registries: {} });
  await assert.rejects(
    repository.assertProjectAccess(row, scope, "read"),
    (error) => error instanceof PersistenceError && error.code === "FORBIDDEN",
  );
});

test("repository permits a private project editor to read and write", async () => {
  const repository = new ProjectRepository({ client: createClient({ workspaceRole: "member", projectRole: "editor" }), registries: {} });
  await repository.assertProjectAccess(row, scope, "read");
  await repository.assertProjectAccess(row, scope, "write");
});

test("repository permits a private project viewer to read but blocks writes", async () => {
  const repository = new ProjectRepository({ client: createClient({ workspaceRole: "member", projectRole: "viewer" }), registries: {} });
  await repository.assertProjectAccess(row, scope, "read");
  await assert.rejects(
    repository.assertProjectAccess(row, scope, "write"),
    (error) => error instanceof PersistenceError && error.code === "FORBIDDEN",
  );
});

test("repository rejects project access in archived workspaces", async () => {
  const repository = new ProjectRepository({ client: createClient({ workspaceStatus: "archived" }), registries: {} });
  await assert.rejects(
    repository.assertProjectAccess(row, scope, "read"),
    (error) => error instanceof PersistenceError && error.code === "FORBIDDEN",
  );
});
test("workspace project updates use the atomic RPC for visibility and its audit event", async () => {
  const snapshot = {
    schemaVersion: 2,
    projectDefinition: {
      name: "Workspace project",
      description: "Atomic visibility update",
      domain: "web-saas",
      difficulty: "Intermediate",
      requirements: "workspace collaboration",
    },
    selectedComponentIds: ["nextjs", "nodejs", "vercel"],
    activeRecipeId: "bootstrapped-payment-dashboard",
    architecture: null,
    developmentPlan: null,
  };
  const row = {
    id: "44444444-4444-4444-8444-444444444444",
    owner_id: scope.userId,
    anonymous_session_id: null,
    workspace_id: scope.workspaceId,
    visibility: "private",
    revision: 1,
    created_at: "2026-11-23T10:00:00.000Z",
    updated_at: "2026-11-23T10:00:00.000Z",
    ...serializeProjectSnapshot(snapshot, registries),
  };
  const client = createClient({ workspaceRole: "owner", projectRow: row });
  const repository = new ProjectRepository({ client, registries });

  const updated = await repository.updateProject({
    scope,
    id: row.id,
    expectedRevision: 1,
    snapshot,
    visibility: "workspace",
  });

  assert.equal(updated.revision, 2);
  assert.equal(updated.visibility, "workspace");
  assert.equal(client.calls.rpc.length, 1);
  assert.equal(client.calls.rpc[0].name, "update_workspace_project_with_audit");
  assert.equal(client.calls.rpc[0].args.p_visibility, "workspace");
  assert.equal(client.calls.rpc[0].args.p_workspace_id, scope.workspaceId);
  assert.equal(client.calls.rpc[0].args.p_actor_id, scope.userId);
  assert.equal(client.calls.tables.includes("workspace_activity_events"), false);
});
