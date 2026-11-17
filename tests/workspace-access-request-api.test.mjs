import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceAccessRequestApi } from "../lib/workspaces/workspace-access-request-api.js";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const user = { id: "22222222-2222-4222-8222-222222222222" };
const workspaceId = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";
const makeRequest = (method, body, path = "/api/workspaces") => new Request("https://example.test" + path, {
  method,
  headers: {
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...(method === "GET" ? {} : { origin: "https://example.test" }),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("discoverable workspace search is scoped to the authenticated user", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceAccessRequestApi({
    service: { listDiscoverableWorkspaces: async (args) => { received = args; return []; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.discover(makeRequest("GET", undefined, "/api/workspaces/discoverable?q=design"));
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId: user.id, search: "design" });
});

test("workspace access requests validate role and message before service access", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createWorkspaceAccessRequestApi({
    service: { requestWorkspaceAccess: async () => { calls += 1; return {}; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.request(makeRequest("POST", { requestedRole: "admin", message: "please" }), workspaceId);
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("workspace access requests pass authenticated requester and requested role", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceAccessRequestApi({
    service: { requestWorkspaceAccess: async (args) => { received = args; return { requestId, status: "pending" }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.request(makeRequest("POST", { requestedRole: "viewer", message: "Read-only access, please." }), workspaceId);
  assert.equal(response.status, 201);
  assert.deepEqual(received, {
    userId: user.id,
    workspaceId,
    message: "Read-only access, please.",
    requestedRole: "viewer",
  });
});

test("workspace access request review is restricted to approve or reject", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createWorkspaceAccessRequestApi({
    service: { reviewAccessRequest: async () => { calls += 1; return {}; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.review(makeRequest("PATCH", { decision: "promote" }), workspaceId, requestId);
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("workspace access request review passes the authenticated actor", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceAccessRequestApi({
    service: { reviewAccessRequest: async (args) => { received = args; return { status: "approved", role: "viewer" }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.review(makeRequest("PATCH", { decision: "approve", role: "viewer" }), workspaceId, requestId);
  assert.equal(response.status, 200);
  assert.deepEqual(received, {
    userId: user.id,
    workspaceId,
    requestId,
    decision: "approve",
    role: "viewer",
  });
});

test("workspace access request service denial is preserved", async () => {
  resetRequestGuardState();
  const api = createWorkspaceAccessRequestApi({
    service: { listAccessRequests: async () => { throw new PersistenceError("FORBIDDEN", "denied"); } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.listForWorkspace(makeRequest("GET"), workspaceId);
  assert.equal(response.status, 403);
});
