import test from "node:test";
import assert from "node:assert/strict";
import { formatAuditReportHeading } from "../scripts/accessibility-report-heading.mjs";

test("uses a neutral heading when no audit label is provided", () => {
  assert.equal(
    formatAuditReportHeading(),
    "# Remaining pages and shared UI accessibility audit",
  );
  assert.equal(
    formatAuditReportHeading("   "),
    "# Remaining pages and shared UI accessibility audit",
  );
});

test("includes an explicit baseline or after-fix label", () => {
  assert.equal(
    formatAuditReportHeading("baseline"),
    "# baseline — Remaining pages and shared UI audit",
  );
  assert.equal(
    formatAuditReportHeading("after-fix"),
    "# after-fix — Remaining pages and shared UI audit",
  );
});

test("trims and collapses whitespace in the configured label", () => {
  assert.equal(
    formatAuditReportHeading("  post-fix\n   verification  "),
    "# post-fix verification — Remaining pages and shared UI audit",
  );
});
