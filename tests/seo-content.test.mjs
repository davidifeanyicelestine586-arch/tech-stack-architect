import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const components = JSON.parse(read("data/components.json"));
const domains = JSON.parse(read("data/domain.json"));
const recipes = JSON.parse(read("data/recipes.json"));

test("every registry id has a generated route", () => {
  assert.match(read("app/(public)/technologies/[id]/page.tsx"), /generateStaticParams/);
  assert.match(read("app/(public)/domains/[id]/page.tsx"), /generateStaticParams/);
  assert.match(read("app/(public)/stacks/[id]/page.tsx"), /generateStaticParams/);
  for (const item of [...components, ...domains, ...recipes]) assert.match(read("lib/content/registry.ts"), new RegExp(item.id));
});

test("registry references resolve to real component ids", () => {
  const ids = new Set(components.map((component) => component.id));
  const references = components.flatMap((component) => [
    ...(component.requires ?? []),
    ...(component.optional ?? []),
    ...(component.conflicts ?? []).map((conflict) => typeof conflict === "string" ? conflict : conflict.component),
  ]);
  const recipeReferences = recipes.flatMap((recipe) => [...recipe.components, ...(recipe.recommended ?? [])]);
  assert.deepEqual([...new Set([...references, ...recipeReferences].filter((id) => !ids.has(id)))], []);
});

test("content routes include canonical metadata and exactly one h1", () => {
  for (const file of [
    "app/(public)/technologies/[id]/page.tsx",
    "app/(public)/domains/[id]/page.tsx",
    "app/(public)/stacks/[id]/page.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /generateMetadata/);
    assert.match(source, /canonical/);
    assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
    assert.match(source, /JsonLd/);
    assert.match(source, /PublicBreadcrumb/);
  }
});
