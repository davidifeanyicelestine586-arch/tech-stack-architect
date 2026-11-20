import assert from "node:assert/strict";
import test from "node:test";
import { createProjectMemberApi } from "../lib/workspaces/project-member-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const scope = {
  kind: "workspace",
  userId: "22222222-2222-4222-8222-222222222222",
  workspaceId: "33333333-3333-4333-8333-333333333333",
};
const projectId = "44444444-4444-4444-8444-444444444444";
const memberId = "55555555-5555-4555-8555-555555555555";
const makeRequest = (method, body) => new Request("https://example.test/api/projects/" + projectId + "/members", {
  method,
  headers: {
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...(method === "GET" ? {} : { origin: "https://example.test" }),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("project member listing requires an active workspace scope", async () => {
  resetRequestGuardState();
  const api = createProjectMemberApi({
    service: { listProjectMembers: async () => ({ members: [], availableMembers: [] }) },
    getScope: async () => ({ kind: "user", userId: scope.userId }),
  });
  const response = await api.list(makeRequest("GET"), projectId);
  assert.equal(response.status, 403);
});

test("project member listing passes authenticated workspace and project scope", async () => {
  resetRequestGuardState();
  let received;
  const result = { members: [{ userId: memberId }], availableMembers: [{ userId: memberId, assigned: true }] };
  const api = createProjectMemberApi({
    service: { listProjectMembers: async (args) => { received = args; return result; } },
    getScope: async () => scope,
  });
  const response = await api.list(makeRequest("GET"), projectId);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId: scope.userId, workspaceId: scope.workspaceId, projectId });
  assert.deepEqual(payload.data, result);
});

test("project member grants validate target user and role", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createProjectMemberApi({
    service: { grantProjectMember: async () => { calls += 1; return {}; } },
    getScope: async () => scope,
  });
  const response = await api.grant(makeRequest("POST", { userId: memberId, role: "owner" }), projectId);
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("project member grants pass only the active workspace and validated role", async () => {
  resetRequestGuardState();
  let received;
  const api = createProjectMemberApi({
    service: { grantProjectMember: async (args) => { received = args; return { userId: memberId, role: "editor" }; } },
    getScope: async () => scope,
  });
  const response = await api.grant(makeRequest("POST", { userId: memberId, role: "editor" }), projectId);
  assert.equal(response.status, 201);
  assert.deepEqual(received, {
    userId: scope.userId,
    workspaceId: scope.workspaceId,
    projectId,
    memberId,
    role: "editor",
  });
});

test("project member removal preserves project administrator authorization failures", async () => {
  resetRequestGuardState();
  const api = createProjectMemberApi({
    service: { removeProjectMember: async () => { throw new PersistenceError("FORBIDDEN", "denied"); } },
    getScope: async () => scope,
  });
  const response = await api.remove(makeRequest("DELETE"), projectId, memberId);
  assert.equal(response.status, 403);
});
