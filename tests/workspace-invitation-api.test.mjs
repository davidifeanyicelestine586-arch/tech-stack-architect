import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  createInvitationAcceptanceApi,
  createWorkspaceInvitationApi,
} from "../lib/workspaces/workspace-invitation-api.js";
import { resetRequestGuardState } from "../lib/security/request-guards.js";

const user = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "owner@example.com",
  emailConfirmedAt: "2026-11-01T10:00:00.000Z",
};
const workspaceId = "33333333-3333-4333-8333-333333333333";
const invitationId = "44444444-4444-4444-8444-444444444444";
const request = (method, body, path = "/api/workspaces") => new Request("https://example.test" + path, {
  method,
  headers: {
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...(method === "GET" ? {} : { origin: "https://example.test" }),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test("workspace invitation creation stores only a token hash and returns a one-time link", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceInvitationApi({
    service: { createInvitation: async (args) => { received = args; return { id: invitationId, email: args.email, role: args.role }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.create(request("POST", { email: "Teammate@Example.com", role: "member" }), workspaceId);
  const payload = await response.json();
  const token = new URL(payload.data.inviteUrl).searchParams.get("token");

  assert.equal(response.status, 201);
  assert.equal(received.email, "teammate@example.com");
  assert.equal(received.userId, user.id);
  assert.equal(received.tokenHash, createHash("sha256").update(token).digest("hex"));
  assert.equal(received.tokenHash.includes(token), false);
  assert.match(payload.data.inviteUrl, /^https:\/\/example\.test\/invite\/accept\?token=/);
});

test("workspace invitation creation rejects invalid roles at the API boundary", async () => {
  resetRequestGuardState();
  const api = createWorkspaceInvitationApi({
    service: { createInvitation: async () => { throw new Error("should not be called"); } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.create(request("POST", { email: "member@example.com", role: "owner" }), workspaceId);
  assert.equal(response.status, 400);
});

test("workspace invitation list is scoped to the requested workspace and authenticated actor", async () => {
  resetRequestGuardState();
  let received;
  const api = createWorkspaceInvitationApi({
    service: { listInvitations: async (args) => { received = args; return []; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.list(request("GET", undefined, "/api/workspaces/" + workspaceId + "/invitations"), workspaceId);
  assert.equal(response.status, 200);
  assert.deepEqual(received, { userId: user.id, workspaceId });
});

test("invitation acceptance requires a verified account email", async () => {
  resetRequestGuardState();
  const api = createInvitationAcceptanceApi({
    service: { acceptInvitation: async () => { throw new Error("should not be called"); } },
    getAuthenticatedUser: async () => ({ ...user, emailConfirmedAt: null }),
  });
  const response = await api.accept(request("POST", { token: "a".repeat(43) }, "/api/invitations/accept"));
  assert.equal(response.status, 401);
});

test("invitation acceptance hashes the token and sets the selected workspace cookie", async () => {
  resetRequestGuardState();
  const rawToken = "A".repeat(43);
  let received;
  const api = createInvitationAcceptanceApi({
    service: { acceptInvitation: async (args) => { received = args; return { workspaceId, role: "member" }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.accept(request("POST", { token: rawToken }, "/api/invitations/accept"));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(received, {
    userId: user.id,
    email: user.email,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
  });
  assert.equal(payload.data.workspaceId, workspaceId);
  assert.match(response.headers.get("set-cookie"), /tsa_active_workspace/);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
});

test("invitation acceptance rejects malformed tokens without calling the service", async () => {
  resetRequestGuardState();
  let calls = 0;
  const api = createInvitationAcceptanceApi({
    service: { acceptInvitation: async () => { calls += 1; return { workspaceId, role: "member" }; } },
    getAuthenticatedUser: async () => user,
  });
  const response = await api.accept(request("POST", { token: "invalid" }, "/api/invitations/accept"));
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});
