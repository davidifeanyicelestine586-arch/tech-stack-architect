import path from "node:path";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

export function shouldFailAccessibilityAudit(summary, failOnFindings = false) {
  if (!failOnFindings) return false;
  return (summary.violations ?? []).length > 0 || (summary.geometryFindings ?? []).length > 0;
}

export function renderAccessibilityAuditHtml(summary, heading, outputRoot) {
  const title = String(heading ?? "# Accessibility regression audit").replace(/^#\s*/, "").trim();
  const results = summary.results ?? [];
  const violations = summary.violations ?? [];
  const geometryFindings = summary.geometryFindings ?? [];
  const incomplete = summary.incomplete ?? [];

  const resultRows = results.map((result) => {
    const documentOverflow = result.geometry.document.scrollWidth > result.geometry.document.clientWidth;
    const screenshotPath = path.relative(outputRoot, result.screenshot).split(path.sep).join("/");
    return `<tr><td>${escapeHtml(result.route)}</td><td>${escapeHtml(result.state)}</td><td>${result.width}</td><td>${result.httpStatus}</td><td>${result.axe.violations.length}</td><td>${result.geometry.intersections.length}</td><td>${documentOverflow ? "Yes" : "No"}</td><td><a href="${escapeHtml(screenshotPath)}">Screenshot</a></td></tr>`;
  }).join("\n");

  const violationRows = violations.map((finding) =>
    `<tr><td>${escapeHtml(finding.route)}</td><td>${escapeHtml(finding.state)}</td><td>${finding.width}</td><td><code>${escapeHtml(finding.id)}</code></td><td>${escapeHtml(finding.impact)}</td><td>${finding.nodes}</td></tr>`,
  ).join("\n");

  const geometryRows = geometryFindings.map((finding) =>
    `<tr><td>${escapeHtml(finding.route)}</td><td>${escapeHtml(finding.state)}</td><td>${finding.width}</td><td><code>${escapeHtml(finding.type)}</code></td><td><details><summary>Details</summary><pre>${escapeHtml(JSON.stringify(finding.extra ?? {}, null, 2))}</pre></details></td></tr>`,
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; font: 15px/1.5 system-ui, sans-serif; }
    body { margin: 0; padding: 2rem; background: Canvas; color: CanvasText; }
    main { max-width: 1200px; margin: 0 auto; }
    h1, h2 { line-height: 1.2; }
    .summary { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1rem 0; }
    .summary span { border: 1px solid #8886; border-radius: .5rem; padding: .65rem .9rem; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin: .75rem 0 1.5rem; }
    caption { text-align: left; font-weight: 600; padding: .5rem 0; }
    th, td { border: 1px solid #8886; padding: .55rem .65rem; text-align: left; vertical-align: top; }
    th { background: #8882; }
    pre { max-width: 50rem; overflow: auto; white-space: pre-wrap; }
    .empty { font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>Audited ${summary.resultCount ?? results.length} route/state/viewport combinations. <a href="remaining-audit.json">JSON results</a> · <a href="remaining-audit.md">Markdown summary</a></p>
    <div class="summary" role="group" aria-label="Audit summary">
      <span>Axe violations: <strong>${violations.length}</strong></span>
      <span>Geometry findings: <strong>${geometryFindings.length}</strong></span>
      <span>Manual-review checks: <strong>${incomplete.length}</strong></span>
    </div>
    <h2>Route and viewport results</h2>
    <div class="table-wrap">
      <table>
        <caption>Per-state responsive and accessibility results</caption>
        <thead><tr><th scope="col">Route</th><th scope="col">State</th><th scope="col">Width</th><th scope="col">HTTP</th><th scope="col">Axe violations</th><th scope="col">Intersections</th><th scope="col">Document overflow</th><th scope="col">Evidence</th></tr></thead>
        <tbody>${resultRows || '<tr><td colspan="8">No results were recorded.</td></tr>'}</tbody>
      </table>
    </div>
    <h2>Axe violations</h2>
    <div class="table-wrap">
      <table>
        <caption>Blocking automated WCAG and best-practice violations</caption>
        <thead><tr><th scope="col">Route</th><th scope="col">State</th><th scope="col">Width</th><th scope="col">Rule</th><th scope="col">Impact</th><th scope="col">Nodes</th></tr></thead>
        <tbody>${violationRows || '<tr><td colspan="6" class="empty">No axe violations.</td></tr>'}</tbody>
      </table>
    </div>
    <h2>Geometry findings</h2>
    <div class="table-wrap">
      <table>
        <caption>Overflow, clipping, and interactive-element intersections</caption>
        <thead><tr><th scope="col">Route</th><th scope="col">State</th><th scope="col">Width</th><th scope="col">Type</th><th scope="col">Details</th></tr></thead>
        <tbody>${geometryRows || '<tr><td colspan="5" class="empty">No geometry findings.</td></tr>'}</tbody>
      </table>
    </div>
    <p>${incomplete.length} axe incomplete check group(s) require manual review and do not fail CI on their own.</p>
  </main>
</body>
</html>
`;
}
