import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceApi } from "../lib/workspaces/workspace-api.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const userId = "22222222-2222-4222-8222-222222222222";
const request = (method, body, headers = {}) => new Request("https://example.test/api/workspaces", {
  method,
  headers: {
    ...(method === "POST" ? { "content-type": "application/json" } : {}),
    ...headers,
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const workspace = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Product team",
  isPersonal: false,
  role: "owner",
};

test("workspace list requires an authenticated user", async () => {
  resetRequestGuardState();
  const api = createWorkspaceApi({
    service: { listWorkspaces: async () => [] },
    getAuthenticatedUserId: async () => null,
  });
  const response = await api.list(request("GET"));
  const payload = await response.json();
  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "UNAUTHORIZED");
});

test("workspace list is scoped to the authenticated user", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceApi({
    service: { listWorkspaces: async (args) => { received = args; return [workspace]; } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.list(request("GET"));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId });
  assert.deepEqual(payload.data.workspaces, [workspace]);
});

test("workspace creation validates and normalizes the name before service access", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createWorkspaceApi({
    service: { createWorkspace: async () => { calls += 1; return workspace; } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.create(request("POST", { name: "x" }));
  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_FAILURE");
  assert.equal(calls, 0);
});

test("workspace creation rejects unrecognised fields", async () => {
  resetRequestGuardState();
  const api = createWorkspaceApi({
    service: { createWorkspace: async () => workspace },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.create(request("POST", { name: "Product team", isOwner: true }));
  assert.equal(response.status, 400);
});

test("workspace creation is same-origin protected", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createWorkspaceApi({
    service: { createWorkspace: async () => { calls += 1; return workspace; } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.create(request("POST", { name: "Product team" }, { origin: "https://attacker.example" }));
  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test("workspace creation returns the created owner workspace", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceApi({
    service: { createWorkspace: async (args) => { received = args; return workspace; } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.create(request("POST", { name: "  Product team  " }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId, name: "Product team" });
  assert.deepEqual(payload.data, workspace);
});

test("workspace service failures do not leak internal details", async () => {
  resetRequestGuardState();
  const api = createWorkspaceApi({
    service: { listWorkspaces: async () => { throw new Error("database secret"); } },
    getAuthenticatedUserId: async () => userId,
  });
  const response = await api.list(request("GET"));
  const text = await response.text();
  assert.equal(response.status, 503);
  assert.equal(text.includes("database secret"), false);
});
