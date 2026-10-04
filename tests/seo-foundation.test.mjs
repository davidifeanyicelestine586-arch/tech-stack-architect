import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("SEO foundation exposes crawlability files", () => {
  assert.match(read("app/robots.ts"), /sitemap\.xml/);
  assert.match(read("app/robots.ts"), /\/api\//);
  assert.match(read("app/robots.ts"), /\/app\//);
  assert.match(read("app/sitemap.ts"), /\/content-detail/);
  assert.match(read("app/manifest.ts"), /standalone/);
});

test("root metadata defines canonical, site base, social image, and favicon", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /metadataBase: new URL\(SITE_URL\)/);
  assert.match(layout, /canonical: \"\/\"/);
  assert.match(layout, /OG-Image\.png/);
  assert.match(layout, /favicon\.ico/);
  assert.match(layout, /twitter:/);
  assert.doesNotMatch(layout, /<head>/);
  assert.doesNotMatch(layout, /<link rel=\"icon\"/);
});

test("public page caching is not forced to private no-store", () => {
  const config = read("next.config.mjs");
  assert.doesNotMatch(config, /private, no-store/);
  assert.match(config, /securityHeaders/);
});

test("SEO site helper uses the production URL with an environment override", () => {
  const site = read("lib/seo/site.ts");
  assert.match(site, /NEXT_PUBLIC_SITE_URL/);
  assert.match(site, /https:\/\/architect\.ediccrew\.com/);
  assert.match(site, /export function absoluteUrl/);
});
