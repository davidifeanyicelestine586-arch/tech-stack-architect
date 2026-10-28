import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3000/app";
const WIDTHS = [375, 390, 414, 768, 1024, 1440];
const HEIGHT = Number(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT || 900);
const THRESHOLD = Number(process.env.NAV_SIDEBAR_OVERLAP_THRESHOLD_PX || 3);
const runName = process.argv[2] || "before";
const outputDir = path.resolve("playwright-report", "navigation-sidebar-audit", runName);
const targetSelector = [
  'button[aria-controls="product-primary-navigation"]',
  '#product-primary-navigation a[href]',
  '#product-primary-navigation button',
  'button.site-header__sidebar-trigger',
  '#workspace-navigation a[href]',
  '#workspace-navigation button',
  '#workspace-navigation summary',
  '#workspace-navigation [role="button"]',
].join(",");

const sourceFor = (selector) => {
  if (selector.includes("product-primary-navigation")) return "components/navigation/product-primary-nav.tsx";
  if (selector.includes("site-header__sidebar-trigger")) return "app/(dashboard-layout)/layout/vertical/header/index.tsx + app/css/components/site-header.css";
  if (selector.includes("workspace-navigation")) return "app/(dashboard-layout)/layout/vertical/sidebar/app-sidebar.tsx + components/ui/sidebar.tsx";
  return "app/(dashboard-layout)/layout/vertical/sidebar/nav-collapse/index.tsx";
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function freshPage(width) {
  const page = await browser.newPage({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("header.site-header").waitFor({ state: "visible", timeout: 30_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
  return page;
}

async function record(page, width, state) {
  const filename = `navigation-sidebar-${width}-${state}.png`;
  const screenshot = path.join(outputDir, filename);
  await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
  const measured = await page.evaluate(({ selector, threshold }) => {
    const nodes = [...document.querySelectorAll(selector)];
    let excludedBackgroundCount = 0;
    const elements = nodes.flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (element.closest('[aria-hidden="true"], [inert]')) {
        excludedBackgroundCount += 1;
        return [];
      }
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width <= 0 || rect.height <= 0) return [];
      const tag = element.tagName.toLowerCase();
      const scope = element.closest("#product-primary-navigation, #workspace-navigation")?.id || (element.matches("button[aria-controls='product-primary-navigation']") ? "product-primary-navigation-toggle" : "sidebar-toggle");
      const classes = [...element.classList].filter((name) => name.startsWith("site-header__") || ["inline-flex", "block", "rounded-md", "min-h-11"].includes(name)).slice(0, 4).join(".");
      const label = element.getAttribute("aria-label") || element.getAttribute("title") || element.innerText?.trim().replace(/\s+/g, " ").slice(0, 64) || "(unlabelled)";
      const prefix = scope === "product-primary-navigation-toggle" ? 'button[aria-controls="product-primary-navigation"]' : scope === "sidebar-toggle" ? "button.site-header__sidebar-trigger" : `#${scope} ${tag}`;
      return [{
        label,
        selector: `${prefix}${classes ? `.${classes}` : ""}${element.getAttribute("aria-label") ? `[aria-label=\"${element.getAttribute("aria-label")}\"]` : ""}`,
        scope,
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      }];
    });
    const overlaps = [];
    for (let i = 0; i < elements.length; i += 1) {
      for (let j = i + 1; j < elements.length; j += 1) {
        const first = elements[i];
        const second = elements[j];
        const width = Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left);
        const height = Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top);
        if (width > threshold && height > threshold) {
          overlaps.push({ first, second, overlap: { width: Number(width.toFixed(1)), height: Number(height.toFixed(1)) } });
        }
      }
    }
    const viewportWidth = window.innerWidth;
    const clipped = elements.flatMap((element) => {
      const left = Math.max(0, -element.rect.left);
      const right = Math.max(0, element.rect.right - viewportWidth);
      return left > threshold || right > threshold
        ? [{ element, left: Number(left.toFixed(1)), right: Number(right.toFixed(1)) }]
        : [];
    });
    return { elements, overlaps, clipped, excludedBackgroundCount };
  }, { selector: targetSelector, threshold: THRESHOLD });

  const files = [...new Set([
    ...measured.overlaps.flatMap(({ first, second }) => [first, second].map((element) => sourceFor(element.selector))),
    ...measured.clipped.map(({ element }) => sourceFor(element.selector)),
  ])];
  results.push({ width, state, screenshot, elementCount: measured.elements.length, excludedBackgroundCount: measured.excludedBackgroundCount, overlaps: measured.overlaps, clipped: measured.clipped, likelyFiles: files });
  await page.close();
}

try {
  for (const width of WIDTHS) {
    let page = await freshPage(width);
    await record(page, width, "baseline");
    await page.close();

    if (width < 640) {
      page = await freshPage(width);
      const menuButton = page.locator('button[aria-controls="product-primary-navigation"]');
      await menuButton.click();
      await page.locator("#product-primary-navigation a[href]").first().waitFor({ state: "visible" });
      await record(page, width, "primary-nav-open");
      await page.close();

      page = await freshPage(width);
      await page.locator("button.site-header__sidebar-trigger").click();
      await page.locator('#workspace-navigation a[href], #workspace-navigation button').first().waitFor({ state: "visible" });
      await record(page, width, "sidebar-open");
      await page.close();

      page = await freshPage(width);
      await page.locator('button[aria-controls="product-primary-navigation"]').click();
      await page.locator("#product-primary-navigation a[href]").first().waitFor({ state: "visible" });
      await page.locator("button.site-header__sidebar-trigger").evaluate((button) => button.click());
      await page.locator('#workspace-navigation a[href], #workspace-navigation button').first().waitFor({ state: "visible" });
      await record(page, width, "both-open");
      await page.close();
    } else {
      page = await freshPage(width);
      await page.locator("button.site-header__sidebar-trigger").click();
      await page.waitForTimeout(200);
      const state = width < 1025 ? "sidebar-open" : "sidebar-collapsed";
      if (width < 1025) await page.locator('#workspace-navigation a[href], #workspace-navigation button').first().waitFor({ state: "visible" });
      await record(page, width, state);
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const report = {
  baseURL: BASE_URL,
  generatedAt: new Date().toISOString(),
  viewportWidths: WIDTHS,
  thresholdPx: THRESHOLD,
  states: [...new Set(results.map((result) => result.state))],
  results,
};
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Navigation/sidebar audit: ${BASE_URL} (intersection threshold > ${THRESHOLD}px)`);
console.log("| Viewport | State | Findings | Likely responsible file(s) |");
console.log("| ---: | --- | --- | --- |");
for (const result of results) {
  const findings = [
    ...result.overlaps.map(({ first, second, overlap }) => `${first.label} (${first.selector}) ↔ ${second.label} (${second.selector}) [${overlap.width}×${overlap.height}px]`),
    ...result.clipped.map(({ element, left, right }) => `horizontal clipping: ${element.label} (${element.selector}) [left ${left}px, right ${right}px]`),
  ];
  console.log(`| ${result.width}px | ${result.state} | ${findings.length ? findings.join("; ") : "None"} | ${result.likelyFiles.length ? result.likelyFiles.join("; ") : "—"} |`);
}
console.log(`Screenshots/report: ${outputDir}`);
const issueCount = results.reduce((sum, result) => sum + result.overlaps.length + result.clipped.length, 0);
if (issueCount) {
  console.error(`FAIL: ${issueCount} navigation/sidebar overlap or clipping finding(s).`);
  process.exitCode = 1;
} else {
  console.log("PASS: no navigation/sidebar interactive-target overlap or horizontal clipping in tested states.");
}
