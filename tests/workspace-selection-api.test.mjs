import assert from "node:assert/strict";
import test from "node:test";
import { ACTIVE_WORKSPACE_COOKIE, createWorkspaceSelectionApi } from "../lib/workspaces/workspace-selection-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const userId = "22222222-2222-4222-8222-222222222222";
const workspaceId = "33333333-3333-4333-8333-333333333333";
const makeRequest = (body, headers = {}) => new Request("https://example.test/api/workspaces/active", {
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

test("active workspace selection requires authentication", async () => {
  resetRequestGuardState();
  const api = createWorkspaceSelectionApi({
    service: { getWorkspaceForMember: async () => ({ id: workspaceId }) },
    getAuthenticatedUserId: async () => null,
  });
  const response = await api.select(makeRequest({ workspaceId }));
  assert.equal(response.status, 401);
});

test("active workspace selection validates membership before setting a cookie", async () => {
  resetRequestGuardState();
  let args;
  const api = createWorkspaceSelectionApi({
    service: { getWorkspaceForMember: async (value) => { args = value; return { id: workspaceId, role: "member" }; } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.select(makeRequest({ workspaceId }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(args, { userId, workspaceId });
  assert.deepEqual(payload.data, { id: workspaceId, role: "member" });
  assert.match(response.headers.get("set-cookie"), new RegExp(ACTIVE_WORKSPACE_COOKIE));
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Lax/);
});

test("active workspace selection rejects unknown fields and malformed identifiers", async () => {
  resetRequestGuardState();
  const api = createWorkspaceSelectionApi({
    service: { getWorkspaceForMember: async () => ({ id: workspaceId }) },
    getAuthenticatedUserId: async () => userId,
  });
  const invalidId = await api.select(makeRequest({ workspaceId: "not-a-uuid" }));
  const extraField = await api.select(makeRequest({ workspaceId, role: "owner" }));
  assert.equal(invalidId.status, 400);
  assert.equal(extraField.status, 400);
});

test("active workspace selection does not set a cookie when membership is denied", async () => {
  resetRequestGuardState();
  const api = createWorkspaceSelectionApi({
    service: { getWorkspaceForMember: async () => { throw new PersistenceError("FORBIDDEN", "denied"); } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.select(makeRequest({ workspaceId }));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("set-cookie"), null);
});
