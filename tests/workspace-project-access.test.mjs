import assert from "node:assert/strict";
import test from "node:test";
import { ProjectRepository, assertScope } from "../lib/persistence/repository/project-repository.js";

const repository = new ProjectRepository({ client: { from() { throw new Error("database should not be queried"); } }, registries: {} });
const scope = {
  kind: "workspace",
  userId: "22222222-2222-4222-8222-222222222222",
  workspaceId: "33333333-3333-4333-8333-333333333333",
};
const project = {
  id: "44444444-4444-4444-8444-444444444444",
  owner_id: "55555555-5555-4555-8555-555555555555",
  workspace_id: scope.workspaceId,
  visibility: "workspace",
};

test("workspace project scope requires valid authenticated user and workspace identifiers", () => {
  assert.deepEqual(assertScope(scope), scope);
  assert.throws(() => assertScope({ ...scope, workspaceId: "invalid" }), { code: "UNAUTHORIZED" });
  assert.throws(() => assertScope({ ...scope, userId: "invalid" }), { code: "UNAUTHORIZED" });
});

test("workspace owners and admins can read and administer private and shared projects", () => {
  for (const role of ["owner", "admin"]) {
    assert.equal(repository.canAccessProject({ ...project, visibility: "private" }, scope, role, undefined, "read"), true);
    assert.equal(repository.canAccessProject({ ...project, visibility: "private" }, scope, role, undefined, "write"), true);
  }
});

test("workspace members can read and edit workspace-visible projects but not private projects", () => {
  assert.equal(repository.canAccessProject(project, scope, "member", undefined, "read"), true);
  assert.equal(repository.canAccessProject(project, scope, "member", undefined, "write"), true);
  assert.equal(repository.canAccessProject({ ...project, visibility: "private" }, scope, "member", undefined, "read"), false);
  assert.equal(repository.canAccessProject({ ...project, visibility: "private" }, scope, "member", undefined, "write"), false);
});

test("workspace viewers can read shared projects but cannot edit them", () => {
  assert.equal(repository.canAccessProject(project, scope, "viewer", undefined, "read"), true);
  assert.equal(repository.canAccessProject(project, scope, "viewer", undefined, "write"), false);
});

test("explicit project roles grant access to private projects without exceeding role permissions", () => {
  const privateProject = { ...project, visibility: "private" };
  assert.equal(repository.canAccessProject(privateProject, scope, "member", "editor", "read"), true);
  assert.equal(repository.canAccessProject(privateProject, scope, "member", "editor", "write"), true);
  assert.equal(repository.canAccessProject(privateProject, scope, "member", "viewer", "read"), true);
  assert.equal(repository.canAccessProject(privateProject, scope, "member", "viewer", "write"), false);
  assert.equal(repository.canAccessProject(privateProject, scope, "member", undefined, "read"), false);
});

test("project creator retains access to their own private project", () => {
  const ownProject = { ...project, visibility: "private", owner_id: scope.userId };
  assert.equal(repository.canAccessProject(ownProject, scope, "member", undefined, "read"), true);
  assert.equal(repository.canAccessProject(ownProject, scope, "member", undefined, "write"), true);
});
