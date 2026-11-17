import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("remaining-page accessibility audit covers public catalog and detail routes", () => {
  const audit = readFileSync(new URL("../scripts/accessibility-remaining-audit.mjs", import.meta.url), "utf8");
  for (const route of [
    "/about",
    "/technologies",
    "/technologies/nextjs",
    "/domains",
    "/domains/web-saas",
    "/stacks",
    "/stacks/bootstrapped-payment-dashboard",
  ]) {
    assert.ok(audit.includes(`route: "${route}"`), `missing accessibility route coverage for ${route}`);
  }
  assert.match(audit, /type:"http-status"/);
  const routeBlock = audit.split("const pages = [")[1]?.split("];")[0] ?? "";
  assert.equal((routeBlock.match(/route: "/g) ?? []).length, 11);
});

test("technology detail stat cards use valid description-list semantics", () => {
  const page = readFileSync(new URL("../app/(public)/technologies/[id]/page.tsx", import.meta.url), "utf8");
  const stat = page.split("function Stat(")[1]?.split("\n}\n")[0] ?? "";
  assert.match(stat, /<dl\b/, "stat terms and descriptions must have a dl parent");
  assert.match(stat, /<dt\b/);
  assert.match(stat, /<dd\b/);
});
