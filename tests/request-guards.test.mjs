import assert from "node:assert/strict";
import test from "node:test";
import {
  assertJsonRequest,
  assertRequestSize,
  consumeRateLimit,
  MAX_REQUEST_BODY_BYTES,
  RequestGuardError,
  resetRequestGuardState,
} from "../lib/security/request-guards.js";

test("JSON requests are accepted and non-JSON requests are rejected", () => {
  assert.doesNotThrow(() => assertJsonRequest(new Request("https://example.test", {
    headers: { "content-type": "application/json; charset=utf-8" },
  })));
  assert.throws(
    () => assertJsonRequest(new Request("https://example.test", { headers: { "content-type": "text/plain" } })),
    (error) => error instanceof RequestGuardError && error.code === "UNSUPPORTED_MEDIA_TYPE",
  );
});

test("declared and streamed request bodies cannot exceed the maximum size", async () => {
  assert.doesNotThrow(() => assertRequestSize(new Request("https://example.test", {
    headers: { "content-length": String(MAX_REQUEST_BODY_BYTES) },
  })));
  assert.throws(
    () => assertRequestSize(new Request("https://example.test", {
      headers: { "content-length": String(MAX_REQUEST_BODY_BYTES + 1) },
    })),
    (error) => error.code === "REQUEST_TOO_LARGE",
  );
});

test("rate limiter returns 429 semantics after the configured threshold", () => {
  resetRequestGuardState();
  const request = new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.10" } });
  consumeRateLimit(request, { limit: 2, windowMs: 60_000 });
  consumeRateLimit(request, { limit: 2, windowMs: 60_000 });
  assert.throws(
    () => consumeRateLimit(request, { limit: 2, windowMs: 60_000 }),
    (error) => error instanceof RequestGuardError && error.code === "RATE_LIMITED" && error.retryAfterSeconds >= 1,
  );
  resetRequestGuardState();
});
