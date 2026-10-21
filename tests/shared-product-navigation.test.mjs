import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("public and workspace shells share the same primary navigation component", () => {
  const nav = read("../components/navigation/product-primary-nav.tsx");
  const publicShell = read("../components/public/public-shell.tsx");
  const workspaceHeader = read("../app/(dashboard-layout)/layout/vertical/header/index.tsx");

  assert.match(publicShell, /<ProductPrimaryNav\s*\/>/);
  assert.match(workspaceHeader, /<ProductPrimaryNav workspace\s*\/>/);
  for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About"]) {
    assert.ok(nav.includes(`label: "${label}"`), `shared navigation includes ${label}`);
  }
});

test("shared primary navigation exposes an accessible mobile disclosure and active page", () => {
  const nav = read("../components/navigation/product-primary-nav.tsx");
  assert.match(nav, /aria-expanded=\{open\}/);
  assert.match(nav, /aria-controls="product-primary-navigation"/);
  assert.match(nav, /aria-label="Primary navigation"/);
  assert.match(nav, /aria-current=\{pathname === href \? "page" : undefined\}/);
  assert.match(nav, /sm:flex-row/);
  assert.match(nav, /min-h-11/);
});

test("shared navigation preserves the workspace entry point", () => {
  const nav = read("../components/navigation/product-primary-nav.tsx");
  assert.match(nav, /href="\/app"/);
  assert.match(nav, /Open the Architect/);
  assert.match(nav, /Workspace/);
});
