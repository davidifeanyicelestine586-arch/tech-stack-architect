import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("public and workspace shells render the same product header and primary navigation", () => {
  const sharedHeader = read("../components/navigation/product-shell-header.tsx");
  const publicShell = read("../components/public/public-shell.tsx");
  const workspaceHeader = read("../app/(dashboard-layout)/layout/vertical/header/index.tsx");
  const primaryNav = read("../components/navigation/product-primary-nav.tsx");

  assert.match(publicShell, /<ProductShellHeader\s*\/>/);
  assert.match(workspaceHeader, /<ProductShellHeader/);
  assert.match(workspaceHeader, /workspaceControls=/);
  assert.match(sharedHeader, /<ProductPrimaryNav\s*\/>/);
  assert.match(sharedHeader, /Tech Stack Architect/);

  for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About"]) {
    assert.ok(primaryNav.includes(`label: "${label}"`));
  }
});

test("primary navigation exposes an accessible disclosure, desktop layout, active page, and Escape focus return", () => {
  const nav = read("../components/navigation/product-primary-nav.tsx");
  assert.match(nav, /aria-expanded=\{open\}/);
  assert.match(nav, /aria-controls="product-primary-navigation"/);
  assert.match(nav, /aria-label="Primary"/);
  assert.match(nav, /aria-current=\{isCurrent\(href\) \? "page" : undefined\}/);
  assert.match(nav, /lg:hidden/);
  assert.match(nav, /lg:flex/);
  assert.match(nav, /event\.key !== "Escape"/);
  assert.match(nav, /menuButtonRef\.current\?\.focus\(\)/);
  assert.match(nav, /min-h-11/);
});

test("shared navigation preserves the workspace entry point and route-aware label", () => {
  const nav = read("../components/navigation/product-primary-nav.tsx");
  assert.match(nav, /href="\/app"/);
  assert.match(nav, /Open the Architect/);
  assert.match(nav, /Workspace/);
  assert.match(nav, /pathname === "\/app"/);
});

test("workspace-only controls are supplied through the optional shared-header region", () => {
  const publicShell = read("../components/public/public-shell.tsx");
  const workspaceHeader = read("../app/(dashboard-layout)/layout/vertical/header/index.tsx");
  assert.doesNotMatch(publicShell, /ProjectPersistenceToolbar|AuthPanel|LightDark|Search/);
  for (const control of ["ProjectPersistenceToolbar", "AuthPanel", "LightDark", "Search"]) {
    assert.ok(workspaceHeader.includes(control), `workspace controls retain ${control}`);
  }
  assert.match(workspaceHeader, /role="group" aria-label="Workspace controls"/);
});
