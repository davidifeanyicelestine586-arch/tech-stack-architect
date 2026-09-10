import assert from "node:assert/strict";
import test from "node:test";
import { safeMessages, statusForCode } from "../lib/persistence/api/project-api.js";

test("API exposes stable safe responses for abuse controls", () => {
  assert.equal(statusForCode("RATE_LIMITED"), 429);
  assert.equal(statusForCode("REQUEST_TOO_LARGE"), 413);
  assert.equal(statusForCode("UNSUPPORTED_MEDIA_TYPE"), 415);
  assert.equal(safeMessages.RATE_LIMITED, "Too many requests. Please try again shortly.");
  assert.equal(safeMessages.REQUEST_TOO_LARGE, "Request body is too large.");
});
