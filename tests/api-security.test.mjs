import assert from "node:assert/strict";
import test from "node:test";
import { PersistenceError } from "../lib/persistence/project-serialization.js";
import { createFailureResponse, statusForCode } from "../lib/persistence/api/project-api.js";

test("forbidden API errors map to HTTP 403", () => {
  assert.equal(statusForCode("FORBIDDEN"), 403);
  assert.equal(statusForCode("UNAUTHORIZED"), 401);
});

test("forbidden API responses expose only a safe permission message", async () => {
  const response = createFailureResponse(
    new PersistenceError("FORBIDDEN", "Administrator permission is required.")
  );
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: {
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    },
  });
});

test("unknown failures remain generic and never expose internal details", async () => {
  const response = createFailureResponse(new Error("database password leaked"));
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "DATABASE_FAILURE");
  assert.equal(payload.error.message, "Project persistence is temporarily unavailable.");
  assert.equal(JSON.stringify(payload).includes("database password"), false);
});
