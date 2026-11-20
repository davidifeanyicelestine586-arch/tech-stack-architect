import assert from "node:assert/strict";
import test from "node:test";
import { ProjectRepository } from "../lib/persistence/repository/project-repository.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";

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

const createClient = ({ workspaceRole = "member", projectRole = null, workspaceStatus = "active" } = {}) => ({
  from(table) {
    const filters = {};
    return {
      select() { return this; },
      eq(column, value) { filters[column] = value; return this; },
      async maybeSingle() {
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
});

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
