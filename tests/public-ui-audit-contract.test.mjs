import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("public shell renders real whitespace and exposes usable responsive navigation", () => {
  const shell = read("components/public/public-shell.tsx");
  assert.doesNotMatch(shell, /\\\\n/);
  for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About", "Open the Architect"]) {
    assert.match(shell, new RegExp(`<Link[^>]*min-h-11[^>]*>${label}<\\\\/Link>`));
  }
  assert.match(shell, /flex-wrap/);
  assert.match(shell, /href="#public-main"/);
  assert.match(shell, /id="public-main"/);
});

test("workflow navigation preserves the canonical six-stage order", () => {
  const workflow = read("lib/navigation/workflow.ts");
  const routes = read("lib/navigation/routes.ts");
  const labels = [...workflow.matchAll(/label: "(Define|Analyze|Review|Build|Validate|Blueprint)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["Define", "Analyze", "Review", "Build", "Validate", "Blueprint"]);
  for (const routeId of ["define", "recommendations", "components", "validation", "blueprint"]) {
    assert.match(workflow, new RegExp(`routeId: "${routeId}"`));
  }
  assert.match(routes, /id: "recommendations", label: "Recommended Stack", href: "\\/app#recommendations"/);
  assert.match(routes, /id: "components", label: "Component Library", href: "\\/app#components"/);
  assert.match(read("components/architect/workflow-progress.tsx"), /aria-current=\\\\{isActive \\? "step" : undefined\\\\}/);
  const workspace = read("app/(dashboard-layout)/app/workspace-client.tsx");
  assert.match(workspace, /workflowStepLabel\\\\("analyze"\\\\)/);
  assert.match(workspace, /workflowStepLabel\\\\("build"\\\\)/);
  assert.doesNotMatch(workspace, /step="\\\\d+ ·/);
});

test("status and issue colors distinguish semantic states in light and dark themes", () => {
  const validation = read("components/architect/validation-panel.tsx");
  const selected = read("components/architect/selected-stack.tsx");
  for (const color of ["emerald", "amber", "rose", "sky", "violet"]) {
    assert.match(validation, new RegExp(`dark:text-${color}-[0-9]+`));
  }
  assert.match(selected, /dark:text-emerald-400/);
  assert.match(selected, /dark:text-amber-400/);
  assert.match(read("components/architect/blueprint-panel.tsx"), /text-emerald-600 dark:text-emerald-400/);
});

test("public catalog and documentation use readable body typography", () => {
  const shell = read("components/public/public-shell.tsx");
  const about = read("app/about/page.tsx");
  const technologies = read("app/(public)/technologies/page.tsx");
  const domains = read("app/(public)/domains/page.tsx");
  const stacks = read("app/(public)/stacks/page.tsx");
  const docs = read("app/(dashboard-layout)/content-detail/page.tsx");
  assert.match(shell, /leading-relaxed/);
  assert.match(about, /text-lg leading-relaxed/);
  for (const source of [technologies, domains, stacks]) assert.match(source, /text-base leading-relaxed text-muted-foreground/);
  assert.match(docs, /text-sm leading-relaxed text-muted-foreground/);
  assert.doesNotMatch(shell, /\\\\n/);
});

test("contact page offers a usable contact route and legal pages disclose review status", () => {
  const contact = read("app/contact/page.tsx");
  const privacy = read("app/privacy/page.tsx");
  const terms = read("app/terms/page.tsx");
  assert.match(contact, /github\\.com\\/davidifeanyicelestine586-arch\\/tech-stack-architect\\/issues/);
  assert.match(privacy, /review/i);
  assert.match(terms, /review/i);
  assert.doesNotMatch(contact, /TODO\\(owner\\)/);
});
