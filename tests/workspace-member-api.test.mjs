import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceMemberApi } from "../lib/workspaces/workspace-member-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const user = { id: "22222222-2222-4222-8222-222222222222" };
const workspaceId = "33333333-3333-4333-8333-333333333333";
const memberId = "44444444-4444-4444-8444-444444444444";
const makeRequest = (method, body, path = "/api/workspaces") => new Request("https://example.test" + path, {
  method,
  headers: {
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...(method === "GET" ? {} : { origin: "https://example.test" }),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("workspace member listing requires authentication and passes the workspace scope", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceMemberApi({
    service: { listMembers: async (args) => { received = args; return []; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.list(makeRequest("GET"), workspaceId);
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId: user.id, workspaceId });
});

test("workspace member role changes validate allowed roles before service access", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createWorkspaceMemberApi({
    service: { updateMemberRole: async () => { calls += 1; return {}; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.updateRole(makeRequest("PATCH", { role: "owner" }), workspaceId, memberId);
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("workspace member role changes pass authenticated actor and validated target", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceMemberApi({
    service: { updateMemberRole: async (args) => { received = args; return { userId: memberId, role: "viewer" }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.updateRole(makeRequest("PATCH", { role: "viewer" }), workspaceId, memberId);
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId: user.id, workspaceId, memberId, role: "viewer" });
});

test("workspace member removal preserves authorization failures", async () => {
  resetRequestGuardState();
  const api = createWorkspaceMemberApi({
    service: { removeMember: async () => { throw new PersistenceError("FORBIDDEN", "denied"); } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.remove(makeRequest("DELETE"), workspaceId, memberId);
  assert.equal(response.status, 403);
});

test("workspace member routes reject malformed identifiers", async () => {
  resetRequestGuardState();
  const api = createWorkspaceMemberApi({
    service: { listMembers: async () => [] },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.list(makeRequest("GET"), "bad-id");
  assert.equal(response.status, 400);
});
