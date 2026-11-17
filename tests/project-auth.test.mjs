import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_WORKSPACE_COOKIE, ANONYMOUS_SESSION_COOKIE, resolveScope } from "../lib/persistence/api/project-api.js";

const sessionId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

const cookieStore = (value = null) => ({
  get: (name) => name === ANONYMOUS_SESSION_COOKIE && value ? { value } : undefined,
});

test("resolveScope uses authenticated user ownership when a valid user is present", async () => {
  const request = new Request("https://example.test/api/projects", {
    headers: { authorization: "Bearer access-token" },
  });
  const result = await resolveScope({
    request,
    getCookieStore: async () => cookieStore(sessionId),
    getAuthenticatedUserId: async () => userId,
  });

  assert.deepEqual(result, {
    scope: { kind: "user", userId },
    setCookie: null,
  });
});

test("resolveScope preserves anonymous sessions when no bearer token is supplied", async () => {
  const request = new Request("https://example.test/api/projects");
  const result = await resolveScope({
    request,
    getCookieStore: async () => cookieStore(sessionId),
    getAuthenticatedUserId: async () => null,
  });

  assert.deepEqual(result, {
    scope: { kind: "anonymous", sessionId },
    setCookie: null,
  });
});

test("resolveScope never falls back to anonymous access when authentication fails", async () => {
  const request = new Request("https://example.test/api/projects", {
    headers: { authorization: "Bearer invalid-token" },
  });
  await assert.rejects(
    resolveScope({
      request,
      getCookieStore: async () => cookieStore(sessionId),
      getAuthenticatedUserId: async () => {
        const error = new Error("invalid token");
        error.code = "UNAUTHORIZED";
        throw error;
      },
    }),
    { message: "invalid token" }
  );
});

test("resolveScope uses a selected workspace only when the authenticated user has supplied its cookie", async () => {
  const workspaceId = "33333333-3333-4333-8333-333333333333";
  const request = new Request("https://example.test/api/projects", {
    headers: { authorization: "Bearer access-token" },
  });
  const result = await resolveScope({
    request,
    getCookieStore: async () => ({
      get: (name) => name === ACTIVE_WORKSPACE_COOKIE ? { value: workspaceId } : undefined,
    }),
    getAuthenticatedUserId: async () => userId,
  });

  assert.deepEqual(result, {
    scope: { kind: "workspace", userId, workspaceId },
    setCookie: null,
  });
});
