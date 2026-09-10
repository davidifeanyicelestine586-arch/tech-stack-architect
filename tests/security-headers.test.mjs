import assert from "node:assert/strict";
import test from "node:test";
import { applySecurityHeaders, securityHeaders } from "../lib/security/headers.js";

test("security policy exposes baseline browser protections", () => {
  assert.equal(securityHeaders["X-Content-Type-Options"], "nosniff");
  assert.equal(securityHeaders["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(securityHeaders["X-Frame-Options"], "DENY");
  assert.equal(securityHeaders["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
});

test("security headers are applied without replacing existing response headers", () => {
  const headers = new Headers({ "content-type": "application/json" });
  applySecurityHeaders(headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
});
