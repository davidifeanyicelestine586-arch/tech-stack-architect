import test from "node:test";
import assert from "node:assert/strict";
import { assertSameOrigin, CsrfError } from "../lib/security/csrf.js";

test("allows same-origin state-changing requests", () => {
  const request = new Request("https://app.example.com/api/projects", {
    method: "POST",
    headers: { origin: "https://app.example.com", "content-type": "application/json" },
    body: "{}",
  });

  assert.doesNotThrow(() => assertSameOrigin(request));
});

test("rejects cross-origin state-changing requests", () => {
  const request = new Request("https://app.example.com/api/projects", {
    method: "POST",
    headers: { origin: "https://evil.example", "content-type": "application/json" },
    body: "{}",
  });

  assert.throws(() => assertSameOrigin(request), (error) =>
    error instanceof CsrfError && error.code === "CSRF_ORIGIN_MISMATCH",
  );
});

test("rejects malformed origins", () => {
  const request = new Request("https://app.example.com/api/projects", {
    method: "DELETE",
    headers: { origin: "not-a-valid-origin" },
  });

  assert.throws(() => assertSameOrigin(request), (error) =>
    error instanceof CsrfError && error.code === "CSRF_ORIGIN_MISMATCH",
  );
});

test("does not require Origin for non-browser or read-only requests", () => {
  const getRequest = new Request("https://app.example.com/api/projects", { method: "GET" });
  const postWithoutOrigin = new Request("https://app.example.com/api/projects", { method: "POST", body: "{}" });

  assert.doesNotThrow(() => assertSameOrigin(getRequest));
  assert.doesNotThrow(() => assertSameOrigin(postWithoutOrigin));
});
