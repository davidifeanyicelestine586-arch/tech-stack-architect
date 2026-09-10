import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSecurityPolicy } from "../lib/security/csp.js";

test("production CSP is restrictive and excludes unsafe-eval", () => {
  const policy = buildContentSecurityPolicy({
    supabaseUrl: "https://project-ref.supabase.co",
    development: false,
  });

  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.match(policy, /connect-src 'self' https:\/\/project-ref\.supabase\.co wss:\/\/project-ref\.supabase\.co/);
  assert.match(policy, /frame-src 'self' https:\/\/project-ref\.supabase\.co/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /upgrade-insecure-requests/);
});

test("development CSP permits Next development evaluation without weakening production", () => {
  const policy = buildContentSecurityPolicy({
    supabaseUrl: "https://project-ref.supabase.co",
    development: true,
  });

  assert.match(policy, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
});

test("invalid Supabase origins fall back to the constrained Supabase wildcard", () => {
  const policy = buildContentSecurityPolicy({
    supabaseUrl: "https://attacker.example.test",
    development: false,
  });

  assert.match(policy, /https:\/\/\*\.supabase\.co/);
  assert.doesNotMatch(policy, /attacker\.example\.test/);
});
