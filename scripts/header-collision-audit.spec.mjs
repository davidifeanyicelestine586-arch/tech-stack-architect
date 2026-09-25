import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const viewports = [375, 390, 414, 768, 1024, 1440];
const reportDir = path.resolve("playwright-report/header-collision");
fs.mkdirSync(reportDir, { recursive: true });

for (const width of viewports) {
  test(`header collision audit — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("header").waitFor();
    await page.screenshot({
      path: path.join(reportDir, `header-${width}.png`),
      fullPage: true,
    });

    const result = await page.locator("header").evaluate((header) => {
      const rectOf = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
      };
      const describe = (el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80),
        ariaLabel: el.getAttribute("aria-label"),
        className: typeof el.className === "string" ? el.className : "",
        selectorHint: el.id ? `#${el.id}` : el.getAttribute("aria-label") ? `[aria-label="${el.getAttribute("aria-label")}"]` : el.tagName.toLowerCase(),
      });
      const intersectionArea = (a, b) => {
        const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x));
        const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
        return width * height;
      };

      const nodes = Array.from(
        header.querySelectorAll("button, a, [role='button'], [role='switch'], [aria-pressed='true'], [data-slot='badge']")
      ).filter((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });

      const items = nodes.map((el) => ({ rect: rectOf(el), meta: describe(el) }));
      const overlaps = [];
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const area = intersectionArea(items[i].rect, items[j].rect);
          if (area > 4) overlaps.push({ area, first: items[i], second: items[j] });
        }
      }
      return { viewport: window.innerWidth, items, overlaps };
    });

    fs.writeFileSync(path.join(reportDir, `header-${width}.json`), JSON.stringify(result, null, 2));
    console.log(`\nViewport ${width}px — ${result.overlaps.length} overlap(s)`);
    for (const overlap of result.overlaps) {
      console.log(JSON.stringify({
        viewport: width,
        first: overlap.first.meta,
        second: overlap.second.meta,
        intersectionArea: overlap.area,
      }));
    }

    expect(result.overlaps, `Header overlap detected at ${width}px`).toEqual([]);
  });
}
