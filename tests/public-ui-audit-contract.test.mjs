import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const escapedNewline = String.fromCharCode(92) + "n";

test("public shell renders real whitespace and exposes usable responsive navigation", () => {
  const shell = read("components/public/public-shell.tsx");
  const navigation = read("components/navigation/product-primary-nav.tsx");
  assert.equal(shell.includes(escapedNewline), false);
  for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About"]) {
    assert.ok(navigation.includes(`label: "${label}"`), `missing shared navigation link: ${label}`);
  }
  assert.ok(navigation.includes("Open the Architect"));
  assert.ok(navigation.includes('href="/app"'));
  assert.ok(shell.includes("flex-nowrap"), "public header keeps the brand and menu on one row");
  assert.ok(navigation.includes("flex items-center justify-end gap-2"), "mobile menu is aligned to the right");
  assert.ok(shell.includes('href="#public-main"'));
  assert.ok(shell.includes('id="public-main"'));
  assert.ok(read("components/navigation/product-primary-nav.tsx").includes("min-h-11"));
  const button = read("components/ui/button.tsx");
  assert.ok(button.includes("cn-button-size-default h-11"));
  assert.ok(button.includes("cn-button-size-icon size-11"));
});

test("account trigger retains an accessible name when its label is hidden responsively", () => {
  const auth = read("components/auth/auth-panel.tsx");
  const headerStyles = read("app/css/components/site-header.css");
  assert.match(auth, /<Button\b[^>]*aria-label="Sign in"[^>]*>/);
  assert.match(auth, /<span>Sign in<\/span>/);
  assert.match(headerStyles, /\.site-header__auth span\s*\{\s*display:\s*none;/);
});

test("workflow navigation preserves the canonical six-stage order", () => {
  const workflow = read("lib/navigation/workflow.ts");
  const routes = read("lib/navigation/routes.ts");
  const labels = [...workflow.matchAll(/label: "(Define|Analyze|Review|Build|Validate|Blueprint)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["Define", "Analyze", "Review", "Build", "Validate", "Blueprint"]);
  for (const routeId of ['routeId: "define"', 'routeId: "recommendations"', 'routeId: "components"', 'routeId: "validation"', 'routeId: "blueprint"']) {
    assert.ok(workflow.includes(routeId), `missing workflow route: ${routeId}`);
  }
  assert.ok(routes.includes('id: "recommendations", label: "Recommended Stack", href: "/app#recommendations"'));
  assert.ok(routes.includes('id: "components", label: "Component Library", href: "/app#components"'));
  assert.ok(read("components/architect/workflow-progress.tsx").includes('aria-current={isActive ? "step" : undefined}'));
  const workspace = read("app/(dashboard-layout)/app/workspace-client.tsx");
  assert.ok(workspace.includes('workflowStepLabel("analyze")'));
  assert.ok(workspace.includes('workflowStepLabel("build")'));
  assert.equal(/step="\d+ ·/.test(workspace), false);
});

test("status and issue colors distinguish semantic states in light and dark themes", () => {
  const validation = read("components/architect/validation-panel.tsx");
  const selected = read("components/architect/selected-stack.tsx");
  for (const color of ["emerald", "amber", "rose", "sky", "violet"]) {
    assert.ok(validation.includes(`dark:text-${color}-`), `missing dark theme status color: ${color}`);
  }
  assert.ok(selected.includes("dark:text-emerald-400"));
  assert.ok(selected.includes("dark:text-amber-400"));
  assert.ok(read("components/architect/blueprint-panel.tsx").includes("text-emerald-600 dark:text-emerald-400"));
  assert.ok(read("components/architect/blueprint-panel.tsx").includes("text-amber-700 dark:text-amber-400"));
});

test("public catalog and documentation use readable body typography", () => {
  const shell = read("components/public/public-shell.tsx");
  const about = read("app/about/page.tsx");
  const technologies = read("app/(public)/technologies/page.tsx");
  const domains = read("app/(public)/domains/page.tsx");
  const stacks = read("app/(public)/stacks/page.tsx");
  const docs = read("app/(dashboard-layout)/content-detail/page.tsx");
  assert.ok(read("components/navigation/product-primary-nav.tsx").includes("min-h-11"));
  assert.ok(about.includes("text-lg leading-relaxed"));
  for (const source of [technologies, domains, stacks]) assert.ok(source.includes("text-base leading-relaxed text-muted-foreground"));
  assert.ok(docs.includes("text-sm leading-relaxed text-muted-foreground"));
  assert.equal(shell.includes(escapedNewline), false);
});

test("contact page offers a usable contact route and legal pages disclose review status", () => {
  const contact = read("app/contact/page.tsx");
  const privacy = read("app/privacy/page.tsx");
  const terms = read("app/terms/page.tsx");
  assert.ok(contact.includes("github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues"));
  assert.ok(/review/i.test(privacy));
  assert.ok(/review/i.test(terms));
  assert.equal(contact.includes("TODO(owner)"), false);
});

test("redesigned landing remains registry-driven and exposes the full architecture journey", () => {
  const landing = read("app/page.tsx");
  const tokens = read("app/globals.css");
  for (const source of ["getAllComponents()", "getAllDomains()", "getAllRecipes()"]) {
    assert.ok(landing.includes(source), `landing must continue using registry source: ${source}`);
  }
  for (const stage of ["Define", "Analyze", "Review", "Build", "Validate", "Blueprint"]) {
    assert.ok(landing.includes(stage), `landing is missing workflow stage: ${stage}`);
  }
  assert.ok(landing.includes('href="/app#define"'));
  assert.ok(landing.includes('href="/technologies"'));
  assert.ok(landing.includes('alternates: { canonical: "/" }'));
  assert.ok(landing.includes('"@type": "SoftwareApplication"'));
  assert.ok(tokens.includes("--primary: oklch(0.39 0.09 163);"));
  assert.ok(tokens.includes("--primary: oklch(0.76 0.13 158);"));
  assert.ok(tokens.includes("@media (prefers-reduced-motion: reduce)"));
});
