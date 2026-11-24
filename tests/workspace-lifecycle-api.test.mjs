import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceLifecycleApi } from "../lib/workspaces/workspace-lifecycle-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const user = { id: "550e8400-e29b-41d4-a716-446655440001" };
const workspaceId = "550e8400-e29b-41d4-a716-446655440002";
const makeRequest = (method, body) => new Request("https://example.test/api/workspaces/" + workspaceId, {
  method,
  headers: {
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    origin: "https://example.test",
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("workspace settings update validates fields and applies only supplied changes", async () => {
  resetRequestGuardState();
  const calls = [];
  const api = createWorkspaceLifecycleApi({
    service: {
      renameWorkspace: async (args) => { calls.push(["rename", args]); return { name: args.name }; },
      setWorkspaceVisibility: async (args) => { calls.push(["visibility", args]); return { visibility: args.visibility }; },
    },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.update(makeRequest("PATCH", { name: "Design Team", visibility: "discoverable" }), workspaceId);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  assert.equal(calls.length, 2);
  assert.equal(calls[0][1].userId, user.id);
  assert.equal(calls[1][1].visibility, "discoverable");
});

test("workspace ownership transfer validates the new owner identifier", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createWorkspaceLifecycleApi({
    service: { transferWorkspaceOwnership: async () => { calls += 1; return { transferred: true }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.transfer(makeRequest("POST", { newOwnerId: "invalid" }), workspaceId);
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("workspace archive and restore use the authenticated actor", async () => {
  resetRequestGuardState();
  const calls = [];
  const api = createWorkspaceLifecycleApi({
    service: {
      archiveWorkspace: async (args) => { calls.push(["archive", args]); return { archived: true }; },
      restoreWorkspace: async (args) => { calls.push(["restore", args]); return { restored: true }; },
    },
    getAuthenticatedUser: async () => user,
  });
  const archived = await api.archive(makeRequest("POST"), workspaceId);
  const restored = await api.restore(makeRequest("POST"), workspaceId);
  assert.equal(archived.status, 200, JSON.stringify(await archived.clone().json()));
  assert.equal(restored.status, 200, JSON.stringify(await restored.clone().json()));
  assert.deepEqual(calls, [
    ["archive", { userId: user.id, workspaceId }],
    ["restore", { userId: user.id, workspaceId }],
  ]);
});

test("workspace lifecycle preserves owner authorization failures", async () => {
  resetRequestGuardState();
  const api = createWorkspaceLifecycleApi({
    service: { archiveWorkspace: async () => { throw new PersistenceError("FORBIDDEN", "owner only"); } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.archive(makeRequest("POST"), workspaceId);
  assert.equal(response.status, 403, JSON.stringify(await response.clone().json()));
});
