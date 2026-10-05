import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3000";
const origin = new URL(BASE_URL).origin;

function normalizeUrl(href) {
  const url = new URL(href, BASE_URL);
  url.hash = "";
  return url.toString().replace(/\/$/, "") || BASE_URL;
}

async function sitemapUrls(request) {
  const response = await request.get(new URL("/sitemap.xml", BASE_URL).toString());
  expect(response.ok()).toBeTruthy();
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizeUrl(match[1]));
}

test("sitemap is crawlable and every public page has complete SEO metadata", async ({ page, request }) => {
  const urls = await sitemapUrls(request);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.some((url) => new URL(url).pathname === "/app")).toBeFalsy();
  expect(urls.some((url) => new URL(url).pathname.startsWith("/api/"))).toBeFalsy();

  const sitemapSet = new Set(urls);
  const incoming = new Map(urls.map((url) => [url, 0]));
  const graph = new Map(urls.map((url) => [url, new Set()]));
  const broken = [];

  for (const url of urls) {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });
    expect(response?.ok(), `Expected 200 for ${url}`).toBeTruthy();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("title")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);

    const hrefs = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean));
    for (const href of hrefs) {
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
      const target = normalizeUrl(href);
      if (new URL(target).origin !== origin) continue;
      if (sitemapSet.has(target)) graph.get(url).add(target);
      const check = await request.get(target);
      if (!check.ok()) broken.push(`${url} -> ${target} (${check.status()})`);
    }
  }

  for (const edges of graph.values()) for (const target of edges) incoming.set(target, (incoming.get(target) || 0) + 1);
  expect(broken, broken.join("\n")).toEqual([]);

  const root = normalizeUrl(BASE_URL);
  const queue = [[root, 0]];
  const depths = new Map([[root, 0]]);
  while (queue.length) {
    const [url, depth] = queue.shift();
    for (const target of graph.get(url) || []) {
      if (!depths.has(target)) {
        depths.set(target, depth + 1);
        queue.push([target, depth + 1]);
      }
    }
  }
  const unreachable = urls.filter((url) => !depths.has(url));
  expect(unreachable, `Unreachable sitemap URLs: ${unreachable.join(", ")}`).toEqual([]);
  expect(Math.max(...depths.values())).toBeLessThanOrEqual(3);
  expect(urls.filter((url) => url !== root && (incoming.get(url) || 0) === 0), "Orphan sitemap URLs").toEqual([]);
});

test("keyboard entry points are reachable without pointer interaction", async ({ page }) => {
  for (const path of ["/", "/technologies/nextjs", "/app"]) {
    await page.goto(new URL(path, BASE_URL).toString(), { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => ({ tag: document.activeElement?.tagName, href: document.activeElement?.getAttribute("href") }));
    expect(first.tag).toBe("A");
    expect(first.href).toBeTruthy();
    expect(await page.locator("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])").count()).toBeGreaterThan(0);
  }
});
