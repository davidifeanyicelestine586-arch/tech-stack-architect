import assert from "node:assert/strict";
import test from "node:test";
import { logSecurityEvent } from "../lib/security/logger.js";

test("security logger emits structured events without sensitive credentials", () => {
  const originalWarn = console.warn;
  let output = "";
  console.warn = (value) => { output = value; };
  try {
    logSecurityEvent("test_event", {
      authorization: "Bearer secret-token",
      nested: { serviceRoleKey: "server-secret" },
      code: "RATE_LIMITED",
    });
  } finally {
    console.warn = originalWarn;
  }

  const entry = JSON.parse(output);
  assert.equal(entry.event, "test_event");
  assert.equal(entry.authorization, "[redacted]");
  assert.equal(entry.nested.serviceRoleKey, "[redacted]");
  assert.equal(output.includes("secret-token"), false);
  assert.equal(output.includes("server-secret"), false);
});
