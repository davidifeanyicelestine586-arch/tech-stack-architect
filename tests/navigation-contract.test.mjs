import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "lib/navigation/routes.ts");
const workspacePath = path.join(root, "app/(dashboard-layout)/page.tsx");

const registry = fs.readFileSync(registryPath, "utf8");
const workspace = fs.readFileSync(workspacePath, "utf8");

const routePattern = /id:\s*"([^"]+)"[\s\S]*?href:\s*"([^"]+)"[\s\S]*?kind:\s*"([^"]+)"/g;
const routes = [...registry.matchAll(routePattern)].map((match) => ({
  id: match[1],
  href: match[2],
  kind: match[3],
}));

test("navigation registry exposes exactly five mobile primary destinations", () => {
  const mobilePrimaryCount = (registry.match(/mobilePrimary:\s*true/g) ?? []).length;
  assert.equal(mobilePrimaryCount, 5);
});

test("navigation registry contains unique route IDs and hrefs", () => {
  assert.ok(routes.length >= 5);
  assert.equal(new Set(routes.map((route) => route.id)).size, routes.length);
  assert.equal(new Set(routes.map((route) => route.href)).size, routes.length);
});

test("registered section destinations map to real workspace anchors", () => {
  for (const route of routes.filter((item) => item.kind === "section")) {
    const hash = route.href.split("#")[1];
    assert.ok(hash, `${route.id} must contain an anchor hash`);
    assert.match(
      workspace,
      new RegExp(`(?:id|href)=?[\\s\\\"]*[\\s\\\"]*${hash}`),
      `${route.href} does not map to a workspace anchor`
    );
  }
});

test("navigation registry keeps page destinations distinct from in-page sections", () => {
  const pageRoutes = routes.filter((route) => route.kind === "page");
  const sectionRoutes = routes.filter((route) => route.kind === "section");
  assert.ok(pageRoutes.some((route) => route.href === "/"));
  assert.ok(pageRoutes.some((route) => route.href === "/content-detail"));
  assert.ok(sectionRoutes.every((route) => route.href.startsWith("/#")));
});
