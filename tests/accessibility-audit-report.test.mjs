import test from "node:test";
import assert from "node:assert/strict";
import { renderAccessibilityAuditHtml, shouldFailAccessibilityAudit } from "../scripts/accessibility-audit-report.mjs";

test("strict accessibility gate fails on axe violations and geometry findings", () => {
  assert.equal(shouldFailAccessibilityAudit({ violations: [{}], geometryFindings: [] }, true), true);
  assert.equal(shouldFailAccessibilityAudit({ violations: [], geometryFindings: [{}] }, true), true);
});

test("incomplete axe checks are informational and non-strict runs do not fail", () => {
  assert.equal(shouldFailAccessibilityAudit({ violations: [], geometryFindings: [], incomplete: [{}] }, true), false);
  assert.equal(shouldFailAccessibilityAudit({ violations: [{}], geometryFindings: [] }, false), false);
});

test("HTML report includes evidence links and escapes untrusted text", () => {
  const summary = {
    resultCount: 1,
    violations: [{ route: "/<script>alert(1)</script>", state: "baseline", width: 375, id: "color-contrast", impact: "serious", nodes: 1 }],
    geometryFindings: [],
    incomplete: [{ id: "color-contrast" }],
    results: [{
      route: "/",
      state: "closed",
      width: 375,
      httpStatus: 200,
      axe: { violations: [] },
      geometry: { intersections: [], document: { scrollWidth: 375, clientWidth: 375 } },
      screenshot: "/tmp/audit/shared-public-nav/closed-375.png",
    }],
  };
  const html = renderAccessibilityAuditHtml(summary, "# CI — Accessibility audit", "/tmp/audit");

  assert.match(html, /<h1>CI — Accessibility audit<\/h1>/);
  assert.match(html, /role="group" aria-label="Audit summary"/);
  assert.match(html, /href="shared-public-nav\/closed-375\.png"/);
  assert.match(html, /href="remaining-audit\.json"/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});
