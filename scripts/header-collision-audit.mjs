import { chromium } from "playwright";

const baseUrl = process.env.HEADER_AUDIT_URL ?? "http://127.0.0.1:3000";
const widths = [375, 390, 414, 768, 1024, 1440];
const height = 900;

const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height } });
    try {
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
      const header = page.locator(".site-header").first();
      await header.waitFor({ state: "visible", timeout: 10_000 });

      const result = await header.evaluate((root) => {
        const candidates = [
          ...root.querySelectorAll(
            'button, a, input, [role="button"], [role="searchbox"], [aria-label^="Persistence status"]'
          ),
        ];
        const visible = candidates.filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" &&
            rect.width > 0 && rect.height > 0;
        });
        const rectOf = (element) => {
          const rect = element.getBoundingClientRect();
          return {
            label: element.getAttribute("aria-label") ||
              element.getAttribute("title") || element.textContent?.trim() || element.tagName,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          };
        };
        const rects = visible.map(rectOf);
        const clipped = rects.filter((rect) =>
          rect.left < -0.5 || rect.right > window.innerWidth + 0.5
        );
        const intersections = [];
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const a = rects[i];
            const b = rects[j];
            const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapX > 1 && overlapY > 1) {
              // Icon/text inside a single button is not collected separately as a candidate.
              intersections.push({ a: a.label, b: b.label, width: overlapX, height: overlapY });
            }
          }
        }
        return { clipped, intersections };
      });

      if (result.clipped.length || result.intersections.length) {
        failures.push({ width, ...result });
      }
      console.log(
        `${width}px: ${result.clipped.length ? "CLIPPED" : "no clipping"}, ` +
        `${result.intersections.length ? "OVERLAP" : "no intersections"}`
      );
    } catch (error) {
      failures.push({ width, error: String(error) });
      console.error(`${width}px: audit failed — ${error}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Header collision audit passed at all ${widths.length} viewport widths.`);
}
