import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("public shell renders real whitespace and exposes usable responsive navigation", () => {
  const shell = read("components/public/public-shell.tsx");
  assert.doesNotMatch(shell, /\\n/);
  for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About", "Open the Architect"]) {
    assert.match(shell, new RegExp(`<Link[^>]*min-h-11[^>]*>${label}<\\/Link>`));
  }
  assert.match(shell, /flex-wrap/);
  assert.match(shell, /href="#public-main"/);
  assert.match(shell, /id="public-main"/);
});

test("workflow navigation has unique stage IDs and valid registered destinations", () => {
  const workflow = read("lib/navigation/workflow.ts");
  const routes = read("lib/navigation/routes.ts");
  assert.match(workflow, /routeId: "define"/);
  assert.match(workflow, /routeId: "recommendations"/);
  assert.match(workflow, /routeId: "components"/);
  assert.match(workflow, /routeId: "validation"/);
  assert.match(workflow, /routeId: "blueprint"/);
  assert.match(routes, /id: "recommendations", label: "Recommended Stack", href: "\/app#recommendations"/);
  assert.match(routes, /id: "components", label: "Component Library", href: "\/app#components"/);
  assert.match(read("components/architect/workflow-progress.tsx"), /aria-current=\{isActive \? "step" : undefined\}/);
});

test("status and issue colors distinguish semantic states in light and dark themes", () => {
  const validation = read("components/architect/validation-panel.tsx");
  const selected = read("components/architect/selected-stack.tsx");
  for (const color of ["emerald", "amber", "rose", "sky", "violet"]) {
    assert.match(validation, new RegExp(`dark:text-${color}-[0-9]+`));
  }
  assert.match(selected, /dark:text-emerald-400/);
  assert.match(selected, /dark:text-amber-400/);
});

test("public pages use readable body typography and avoid literal escaped newlines", () => {
  const shell = read("components/public/public-shell.tsx");
  const about = read("app/about/page.tsx");
  assert.match(shell, /leading-relaxed/);
  assert.match(about, /text-lg leading-relaxed/);
  assert.doesNotMatch(shell, /\\n/);
});

test("contact page offers a working contact route and legal pages clearly disclose review status", () => {
  const contact = read("app/contact/page.tsx");
  const privacy = read("app/privacy/page.tsx");
  const terms = read("app/terms/page.tsx");
  assert.match(contact, /github\.com\/davidifeanyicelestine586-arch\/tech-stack-architect\/issues/);
  assert.match(privacy, /review/i);
  assert.match(terms, /review/i);
  assert.doesNotMatch(contact, /TODO\(owner\)/);
});
