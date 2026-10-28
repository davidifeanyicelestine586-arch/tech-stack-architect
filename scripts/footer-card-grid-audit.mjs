import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3000/app";
const WIDTHS = [375, 390, 414, 768, 1024, 1440];
const HEIGHT = Number(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT || 900);
const THRESHOLD = Number(process.env.CARD_GRID_THRESHOLD_PX || 3);
const runName = process.argv[2] || "before";
const outputDir = path.resolve("playwright-report", "footer-card-grid-audit", runName);

const sourceFor = (grid) => {
  if (grid.region === "footer") return "components/layout/footer.tsx";
  if (grid.region === "validation panel") return "components/architect/validation-panel.tsx";
  if (grid.label === "Technology catalog") return "components/architect/component-browser.tsx";
  if (grid.label === "Project type") return "components/architect/domain-selector.tsx";
  if (grid.region === "recommendations") return "components/architect/recommendation-panel.tsx";
  if (grid.region === "recipes") return "components/architect/recipe-recommendations.tsx";
  if (grid.label === "Architecture progress") return "components/architect/workflow-progress.tsx";
  if (grid.region === "project definition") return "components/architect/project-definition-form.tsx";
  if (grid.region === "components") return "components/architect/component-card.tsx";
  return "app/(dashboard-layout)/app/workspace-client.tsx";
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function freshPage(width) {
  const page = await browser.newPage({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 30_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(150);
  return page;
}

async function record(page, width, state) {
  const screenshot = path.join(outputDir, `footer-card-grid-${width}-${state}.png`);
  await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
  const measured = await page.evaluate((threshold) => {
    const toRect = (rect) => ({
      left: Number(rect.left.toFixed(1)), top: Number(rect.top.toFixed(1)),
      right: Number(rect.right.toFixed(1)), bottom: Number(rect.bottom.toFixed(1)),
      width: Number(rect.width.toFixed(1)), height: Number(rect.height.toFixed(1)),
    });
    const viewportWidth = window.innerWidth;
    const grids = [...document.querySelectorAll("#main-content .grid, footer .grid")]
      .filter((grid) => getComputedStyle(grid).display === "grid")
      .map((grid, gridIndex) => {
        const rect = grid.getBoundingClientRect();
        const children = [...grid.children].filter((child) => {
          const style = getComputedStyle(child);
          const box = child.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
        });
        const classes = [...grid.classList];
        const classHint = classes.filter((name) => name === "grid" || name.includes("grid-cols-") || name === "items-start" || name === "gap-4" || name === "gap-6").slice(0, 8);
        const region = grid.closest("footer") ? "footer"
          : grid.closest("#recommendations") ? "recommendations"
            : grid.closest("#recipes") ? "recipes"
              : grid.closest("#validation") ? "validation panel"
                : grid.closest("#define") ? "project definition"
                  : grid.closest('[aria-label="Architecture progress"]') ? "workflow progress"
                    : grid.closest("#components") ? "components"
                      : "main content";
        const label = grid.getAttribute("aria-label") || grid.getAttribute("role") && grid.getAttribute("aria-label") || grid.closest('[aria-label="Architecture progress"]')?.getAttribute("aria-label") || (grid.id ? `#${grid.id}` : `grid ${gridIndex + 1}`);
        const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
        const gridOverflow = Math.max(0, grid.scrollWidth - grid.clientWidth);
        const gridClippedLeft = Math.max(0, -rect.left);
        const gridClippedRight = Math.max(0, rect.right - viewportWidth);
        const items = children.map((child, itemIndex) => {
          const box = child.getBoundingClientRect();
          const childClasses = [...child.classList].filter((name) => name === "min-w-0" || name.startsWith("col-") || name.startsWith("md:col-") || name.startsWith("lg:col-")).slice(0, 4);
          const name = child.getAttribute("aria-label") || child.getAttribute("data-slot") || child.innerText?.trim().replace(/\s+/g, " ").slice(0, 52) || `item ${itemIndex + 1}`;
          const innerOverflow = Math.max(0, child.scrollWidth - child.clientWidth);
          const overflowMode = getComputedStyle(child).overflowX;
          return {
            name,
            selector: `${child.tagName.toLowerCase()}${child.id ? `#${child.id}` : ""}${childClasses.map((className) => `.${className}`).join("")}`,
            rect: toRect(box),
            outsideLeft: Number(Math.max(0, -box.left).toFixed(1)),
            outsideRight: Number(Math.max(0, box.right - viewportWidth).toFixed(1)),
            innerOverflow: overflowMode === "hidden" || overflowMode === "clip" ? 0 : Number(innerOverflow.toFixed(1)),
          };
        });
        const overlaps = [];
        for (let i = 0; i < items.length; i += 1) {
          for (let j = i + 1; j < items.length; j += 1) {
            const a = items[i].rect;
            const b = items[j].rect;
            const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapWidth > threshold && overlapHeight > threshold) {
              overlaps.push({ first: items[i], second: items[j], overlap: { width: Number(overlapWidth.toFixed(1)), height: Number(overlapHeight.toFixed(1)) } });
            }
          }
        }
        const interactions = [...grid.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"]')]
          .filter((element) => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
          })
          .map((element) => {
            const box = element.getBoundingClientRect();
            return {
              label: element.getAttribute("aria-label") || element.getAttribute("title") || element.innerText?.trim().replace(/\s+/g, " ").slice(0, 44) || element.tagName.toLowerCase(),
              selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[...element.classList].filter((name) => name.startsWith("site-") || ["min-h-11", "w-full", "truncate"].includes(name)).slice(0, 3).map((name) => `.${name}`).join("")}`,
              rect: toRect(box),
            };
          });
        const controlOverlaps = [];
        for (let i = 0; i < interactions.length; i += 1) {
          for (let j = i + 1; j < interactions.length; j += 1) {
            const a = interactions[i].rect;
            const b = interactions[j].rect;
            const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapWidth > threshold && overlapHeight > threshold) {
              controlOverlaps.push({ first: interactions[i], second: interactions[j], overlap: { width: Number(overlapWidth.toFixed(1)), height: Number(overlapHeight.toFixed(1)) } });
            }
          }
        }
        return {
          label, region, textHint: grid.innerText?.trim().replace(/\s+/g, " ").slice(0, 120), selector: `${grid.tagName.toLowerCase()}${grid.id ? `#${grid.id}` : ""}.${classHint.join(".")}`,
          className: grid.className.toString(), columns, childCount: children.length,
          rect: toRect(rect), gridOverflow: Number(gridOverflow.toFixed(1)), gridClippedLeft: Number(gridClippedLeft.toFixed(1)), gridClippedRight: Number(gridClippedRight.toFixed(1)),
          items, overlaps, controlOverlaps,
        };
      });

    const footer = document.querySelector("footer");
    const footerLinks = footer ? [...footer.querySelectorAll('a[href], button')].map((element) => {
      const box = element.getBoundingClientRect();
      return { label: element.getAttribute("aria-label") || element.innerText?.trim().replace(/\s+/g, " ") || "(unlabelled)", rect: toRect(box) };
    }) : [];
    const footerOverlaps = [];
    for (let i = 0; i < footerLinks.length; i += 1) {
      for (let j = i + 1; j < footerLinks.length; j += 1) {
        const a = footerLinks[i].rect;
        const b = footerLinks[j].rect;
        const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapWidth > threshold && overlapHeight > threshold) footerOverlaps.push({ first: footerLinks[i], second: footerLinks[j], overlap: { width: Number(overlapWidth.toFixed(1)), height: Number(overlapHeight.toFixed(1)) } });
      }
    }
    return {
      viewportWidth, documentScrollWidth: document.documentElement.scrollWidth,
      bodyHorizontalOverflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
      grids, footerLinks, footerOverlaps,
    };
  }, THRESHOLD);

  const issues = [];
  for (const grid of measured.grids) {
    const source = sourceFor(grid);
    if (grid.gridOverflow > THRESHOLD) issues.push({ kind: "grid horizontal overflow", source, grid: grid.selector, amount: grid.gridOverflow });
    if (grid.gridClippedLeft > THRESHOLD || grid.gridClippedRight > THRESHOLD) issues.push({ kind: "grid clipped by viewport", source, grid: grid.selector, left: grid.gridClippedLeft, right: grid.gridClippedRight });
    for (const overlap of grid.overlaps) issues.push({ kind: "grid items overlap", source, grid: grid.selector, first: overlap.first, second: overlap.second, overlap: overlap.overlap });
    for (const overlap of grid.controlOverlaps) issues.push({ kind: "interactive controls overlap within grid", source, grid: grid.selector, first: overlap.first, second: overlap.second, overlap: overlap.overlap });
    for (const item of grid.items) {
      if (item.outsideLeft > THRESHOLD || item.outsideRight > THRESHOLD) issues.push({ kind: "grid item clipped by viewport", source, grid: grid.selector, item: item.name, left: item.outsideLeft, right: item.outsideRight });
      if (item.innerOverflow > THRESHOLD) issues.push({ kind: "grid item horizontal overflow", source, grid: grid.selector, item: item.name, amount: item.innerOverflow });
    }
  }
  for (const overlap of measured.footerOverlaps) issues.push({ kind: "footer links overlap", source: "components/layout/footer.tsx", first: overlap.first, second: overlap.second, overlap: overlap.overlap });
  if (measured.bodyHorizontalOverflow > THRESHOLD) issues.push({ kind: "document horizontal overflow", source: "app/(dashboard-layout)/layout.tsx or the overflowing content component", amount: measured.bodyHorizontalOverflow });

  results.push({ width, state, screenshot, documentScrollWidth: measured.documentScrollWidth, bodyHorizontalOverflow: measured.bodyHorizontalOverflow, gridCount: measured.grids.length, footerLinkCount: measured.footerLinks.length, grids: measured.grids, issues });
}

try {
  for (const width of WIDTHS) {
    const page = await freshPage(width);
    await record(page, width, "baseline");

    await page.locator("#project-name").fill("Responsive Grid Audit Sample");
    await page.locator("#project-domain").selectOption("web-saas");
    await page.locator("#project-description").fill("A web application that helps teams plan a secure SaaS product with a responsive architecture dashboard.");
    await page.locator("#project-requirements").fill("Web app, API, database, authentication, cloud hosting, analytics, responsive dashboard");
    await page.locator("#define form button[type='submit']").click();
    await page.locator('#components [aria-label="Technology catalog"]').waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForTimeout(200);
    await record(page, width, "analyzed");

    const addRecommendation = page.locator('#recommendations .grid > [data-slot="card"] button').first();
    if (await addRecommendation.count()) {
      await addRecommendation.click();
    } else {
      await page.locator('#components [aria-label="Technology catalog"] button[aria-label^="Add "]').first().click();
    }
    await page.locator("#recipes").waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(200);
    await record(page, width, "selected-stack");
    await page.close();
  }
} finally {
  await browser.close();
}

const report = {
  baseURL: BASE_URL,
  generatedAt: new Date().toISOString(),
  viewportWidths: WIDTHS,
  states: ["baseline", "analyzed", "selected-stack"],
  thresholdPx: THRESHOLD,
  results,
};
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Footer/card-grid audit: ${BASE_URL} (overlap/overflow threshold > ${THRESHOLD}px)`);
console.log("| Viewport | State | Grids measured | Findings | Likely responsible file(s) |");
console.log("| ---: | --- | ---: | --- | --- |");
for (const result of results) {
  const grouped = new Map();
  for (const issue of result.issues) {
    const key = `${issue.kind}${issue.grid ? ` in ${issue.grid}` : ""}`;
    const prior = grouped.get(key) || { count: 0, maxAmount: 0 };
    prior.count += 1;
    prior.maxAmount = Math.max(prior.maxAmount, issue.amount || issue.right || 0, issue.left || 0);
    grouped.set(key, prior);
  }
  const findings = [...grouped].map(([name, value]) => `${name}${value.count > 1 ? ` ×${value.count}` : ""}${value.maxAmount > 0 ? ` (${value.maxAmount}px)` : ""}`);
  const sources = [...new Set(result.issues.map((issue) => issue.source))];
  console.log(`| ${result.width}px | ${result.state} | ${result.gridCount} | ${findings.length ? findings.join("; ") : "None"} | ${sources.length ? sources.join("; ") : "—"} |`);
  console.log(`  screenshot: ${result.screenshot}`);
}
console.log(`Detailed report: ${path.join(outputDir, "report.json")}`);
const issueCount = results.reduce((sum, result) => sum + result.issues.length, 0);
if (issueCount) {
  console.error(`FAIL: ${issueCount} footer/card-grid layout finding(s).`);
  process.exitCode = 1;
} else {
  console.log("PASS: no card-grid overlap/overflow, footer-link overlap, or document horizontal overflow detected.");
}
