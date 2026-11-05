import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hasClientDirective = (source) => /^\s*["']use client["'];/m.test(source);

test("public and workspace shells render the same product header and primary navigation", () => {
  const sharedHeader = read("../components/navigation/product-shell-header.tsx");
  const publicShell = read("../components/public/public-shell.tsx");
  const workspaceHeader = read("../app/(dashboard-layout)/layout/vertical/header/index.tsx");
  const primaryNav = read("../components/navigation/product-primary-nav.tsx");

  assert.match(publicShell, /<ProductShellHeader\s*\/>/);
  assert.match(workspaceHeader, /<ProductShellHeader/);
  assert.match(workspaceHeader, /workspaceControls=\{<WorkspaceHeaderControls\s*\/>\}/);
  assert.match(sharedHeader, /<ProductPrimaryNav\s*\/>/);
  assert.match(sharedHeader, /Tech Stack Architect/);

  for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About"]) {
    assert.ok(primaryNav.includes(`label: "${label}"`));
  }
});

test("shared header wrappers stay server-rendered and interactive behavior stays in client islands", () => {
  const sharedHeader = read("../components/navigation/product-shell-header.tsx");
  const publicShell = read("../components/public/public-shell.tsx");
  const workspaceHeader = read("../app/(dashboard-layout)/layout/vertical/header/index.tsx");
  const dashboardLayout = read("../app/(dashboard-layout)/layout.tsx");
  const dashboardClientShell = read("../app/(dashboard-layout)/dashboard-client-shell.tsx");
  const workspaceControls = read("../app/(dashboard-layout)/layout/vertical/header/workspace-header-controls.tsx");
  const primaryNav = read("../components/navigation/product-primary-nav.tsx");

  assert.equal(hasClientDirective(sharedHeader), false);
  assert.equal(hasClientDirective(publicShell), false);
  assert.equal(hasClientDirective(workspaceHeader), false);
  assert.equal(hasClientDirective(dashboardLayout), false);
  assert.equal(hasClientDirective(dashboardClientShell), true);
  assert.equal(hasClientDirective(workspaceControls), true);
  assert.equal(hasClientDirective(primaryNav), true);

  assert.match(dashboardLayout, /<DashboardClientShell header=\{<Header \/>} footer=\{<Footer \/>}>/);
  assert.match(dashboardClientShell, /<SidebarProvider[\s\S]*\{header\}[\s\S]*<\/SidebarProvider>/);
  assert.match(workspaceControls, /useSidebar\(\)/);
});

test("shared product header uses the supplied theme-appropriate responsive wordmarks", () => {
  const header = read("../components/navigation/product-shell-header.tsx");
  assert.match(header, /src="\/brand\/logo-full-light\.png"/);
  assert.match(header, /src="\/brand\/logo-full-dark\.png"/);
  assert.match(header, /dark:hidden/);
  assert.match(header, /dark:block/);
  assert.match(header, /sizes="\(min-width: 640px\) 150px, 124px"/);

  for (const asset of ["logo-full-light.png", "logo-full-dark.png"]) {
    assert.ok(fs.existsSync(new URL(`../public/brand/${asset}`, import.meta.url)));
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

test("workspace-only controls remain isolated from the public shell and retain their accessibility contract", () => {
  const publicShell = read("../components/public/public-shell.tsx");
  const workspaceControls = read("../app/(dashboard-layout)/layout/vertical/header/workspace-header-controls.tsx");
  assert.doesNotMatch(publicShell, /ProjectPersistenceToolbar|AuthPanel|LightDark|Search/);
  for (const control of ["ProjectPersistenceToolbar", "AuthPanel", "LightDark", "Search"]) {
    assert.ok(workspaceControls.includes(control), `workspace controls retain ${control}`);
  }
  assert.match(workspaceControls, /role="group" aria-label="Workspace controls"/);
  assert.match(workspaceControls, /aria-controls="workspace-navigation"/);
});
