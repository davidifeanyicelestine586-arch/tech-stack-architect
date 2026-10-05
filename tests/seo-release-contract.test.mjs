import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const components = JSON.parse(read("data/components.json"));
const domains = JSON.parse(read("data/domain.json"));
const recipes = JSON.parse(read("data/recipes.json"));

const contentDescription = (description) => {
  const suffix = " Explore this entry in the Ediccrew Tech Stack Architect registry.";
  if (description.length >= 140 && description.length <= 160) return description;
  if (description.length > 160) return `${description.slice(0, 157).replace(/[,;:]?\\s+\\S*$/, "")}...`;
  return `${description}${suffix}`;
};

test("all generated content metadata is unique and within the requested description range", () => {
  const entries = [
    ...components.map((item) => ({ title: item.name, description: contentDescription(item.description) })),
    ...domains.map((item) => ({ title: item.title, description: contentDescription(item.description) })),
    ...recipes.map((item) => ({ title: item.title, description: contentDescription(item.description) })),
  ];
  assert.equal(new Set(entries.map((entry) => entry.title)).size, entries.length);
  assert.equal(new Set(entries.map((entry) => entry.description)).size, entries.length);
  for (const entry of entries) assert.ok(entry.description.length >= 140 && entry.description.length <= 160, `Description out of range: ${entry.title} (${entry.description.length})`);
});

test("public content routes keep canonical metadata, breadcrumbs, JSON-LD and workspace CTAs", () => {
  for (const file of ["app/(public)/technologies/[id]/page.tsx", "app/(public)/domains/[id]/page.tsx", "app/(public)/stacks/[id]/page.tsx"]) {
    const source = read(file);
    assert.match(source, /generateStaticParams/);
    assert.match(source, /canonical/);
    assert.match(source, /JsonLd/);
    assert.match(source, /PublicBreadcrumb/);
    assert.match(source, /href="\/app"/);
    assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
  }
});

test("workspace results expose polite status semantics", () => {
  assert.match(read("components/architect/validation-panel.tsx"), /role="status"/);
  assert.match(read("components/architect/blueprint-panel.tsx"), /role="status"/);
});

test("sitemap contains all public hubs and excludes the workspace", () => {
  const sitemap = read("app/sitemap.ts");
  const robots = read("app/robots.ts");
  for (const publicPath of ["/", "/technologies", "/domains", "/stacks", "/about", "/contact", "/privacy", "/terms", "/content-detail"]) {
    assert.match(sitemap, new RegExp(publicPath.replace("/", "\\/")));
  }
  assert.doesNotMatch(sitemap, /["']\/app["']/);
  assert.match(robots, /disallow:.*\/app\//);
});

test("security headers remain declared in the shared security header set", () => {
  const config = read("next.config.mjs");
  for (const header of ["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Content-Security-Policy"]) assert.match(config, new RegExp(header));
});
