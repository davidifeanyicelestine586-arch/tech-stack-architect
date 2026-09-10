import test from "node:test";
import assert from "node:assert/strict";
import {
  authStateFromEvent,
  getSafeAuthErrorMessage,
  isKnownAuthEvent,
  isSessionActive,
} from "../lib/auth/auth-lifecycle.js";

test("auth lifecycle recognizes supported Supabase auth events", () => {
  for (const event of ["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED", "PASSWORD_RECOVERY"]) {
    assert.equal(isKnownAuthEvent(event), true);
  }
  assert.equal(isKnownAuthEvent("UNKNOWN_EVENT"), false);
});

test("signed out always clears the client auth state", () => {
  assert.deepEqual(
    authStateFromEvent("SIGNED_OUT", { access_token: "stale", user: { id: "old-user" } }),
    { user: null, session: null },
  );
});

test("sign-in and token refresh preserve the current session user", () => {
  const session = { access_token: "access", user: { id: "user-1" } };
  assert.deepEqual(authStateFromEvent("SIGNED_IN", session), { user: session.user, session });
  assert.deepEqual(authStateFromEvent("TOKEN_REFRESHED", session), { user: session.user, session });
});

test("active sessions require both an access token and user id", () => {
  assert.equal(isSessionActive({ access_token: "access", user: { id: "user-1" } }), true);
  assert.equal(isSessionActive({ access_token: "", user: { id: "user-1" } }), false);
  assert.equal(isSessionActive({ access_token: "access", user: null }), false);
});

test("authentication errors are mapped to safe user-facing messages", () => {
  assert.equal(getSafeAuthErrorMessage({ message: "Invalid login credentials" }), "Your email or password is incorrect.");
  assert.equal(getSafeAuthErrorMessage({ message: "Email not confirmed" }), "Check your email to confirm your account before signing in.");
  assert.equal(getSafeAuthErrorMessage({ code: "over_request_rate_limit" }), "Too many authentication attempts. Please wait and try again.");
  assert.equal(getSafeAuthErrorMessage({ message: "Failed to fetch" }), "Authentication is temporarily unavailable. Check your connection and try again.");
  assert.equal(getSafeAuthErrorMessage({ message: "provider internal secret abc" }), "Authentication failed. Please try again.");
});

test("unknown auth events do not mutate state", () => {
  assert.equal(authStateFromEvent("UNSUPPORTED", { user: { id: "user-1" } }), null);
});
