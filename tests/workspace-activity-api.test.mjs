import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceActivityApi } from "../lib/workspaces/workspace-activity-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const workspaceId = "33333333-3333-4333-8333-333333333333";
const userId = "22222222-2222-4222-8222-222222222222";
const request = new Request("https://example.test/api/workspaces/" + workspaceId + "/activity", {
  method: "GET",
  headers: { authorization: "Bearer token" },
});

test("workspace activity is scoped to the authenticated member", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceActivityApi({
    service: { listActivity: async (args) => { received = args; return [{ id: "event-1" }]; } },
    getAuthenticatedUser: async () => ({ id: userId }),
  });
  const response = await api.list(request, workspaceId);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId, workspaceId });
  assert.deepEqual(payload.data.activity, [{ id: "event-1" }]);
});

test("workspace activity rejects unauthenticated requests", async () => {
  resetRequestGuardState();
  const api = createWorkspaceActivityApi({
    service: { listActivity: async () => [] },
    getAuthenticatedUser: async () => null,
  });
  const response = await api.list(request, workspaceId);
  assert.equal(response.status, 401);
});

test("workspace activity preserves membership denial", async () => {
  resetRequestGuardState();
  const api = createWorkspaceActivityApi({
    service: { listActivity: async () => { throw new PersistenceError("FORBIDDEN", "denied"); } },
    getAuthenticatedUser: async () => ({ id: userId }),
  });
  const response = await api.list(request, workspaceId);
  assert.equal(response.status, 403);
});
