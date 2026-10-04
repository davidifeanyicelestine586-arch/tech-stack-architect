import { test, expect } from "playwright/test";
import fs from "node:fs";
import path from "node:path";

const viewports = [320, 375, 390, 414, 480, 768, 820, 992, 1024, 1200, 1280, 1440];
const reportDir = path.resolve("playwright-report/header-collision");
fs.mkdirSync(reportDir, { recursive: true });

for (const width of viewports) {
  test(`header collision audit — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app", { waitUntil: "networkidle" });
    const header = page.locator("header");
    await header.waitFor();

    const initial = await header.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return { top: r.top, height: r.height, bottom: r.bottom };
    });

    await page.screenshot({
      path: path.join(reportDir, `header-${width}.png`),
      fullPage: true,
    });

    const result = await header.evaluate((header) => {
      const rectOf = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
      };
      const describe = (el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80),
        ariaLabel: el.getAttribute("aria-label"),
        className: typeof el.className === "string" ? el.className : "",
        selectorHint: el.id
          ? `#${el.id}`
          : el.getAttribute("aria-label")
            ? `[aria-label="${el.getAttribute("aria-label")}"]`
            : el.tagName.toLowerCase(),
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
      const overflowing = items.filter((item) =>
        item.rect.x < -4 || item.rect.right > window.innerWidth + 4 || item.rect.y < -4
      );

      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const area = intersectionArea(items[i].rect, items[j].rect);
          if (area > 4) overlaps.push({ area, first: items[i], second: items[j] });
        }
      }

      return {
        viewport: window.innerWidth,
        headerHeight: header.getBoundingClientRect().height,
        headerTop: header.getBoundingClientRect().top,
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 4,
        items,
        overlaps,
        overflowing,
      };
    });

    fs.writeFileSync(path.join(reportDir, `header-${width}.json`), JSON.stringify(result, null, 2));

    expect(result.overlaps, `Header overlap detected at ${width}px`).toEqual([]);
    expect(result.pageOverflow, `Page overflow detected at ${width}px`).toBe(false);
    expect(result.overflowing, `Header element overflow detected at ${width}px`).toEqual([]);

    await page.evaluate(() => window.scrollTo({ top: Math.max(0, document.body.scrollHeight - window.innerHeight), behavior: "instant" }));
    const afterScroll = await header.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return { top: r.top, height: r.height, bottom: r.bottom };
    });

    expect(afterScroll.top, `Sticky header moved off-screen at ${width}px`).toBeGreaterThanOrEqual(-1);
    expect(Math.abs(afterScroll.height - initial.height), `Header height changed while scrolling at ${width}px`).toBeLessThanOrEqual(1);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));

    if (width <= 767) {
      const search = page.locator('input[aria-label="Search workspace navigation"]');
      await search.focus();
      await expect(search).toBeFocused();
      const searchRect = await search.boundingBox();
      expect(searchRect?.width ?? 0, `Mobile search did not expand at ${width}px`).toBeGreaterThan(100);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 4)).toBe(true);
      await search.press("Escape").catch(() => {});
    }

    const focusTarget = page.locator("#main-content button, #main-content a").first();
    if (await focusTarget.count()) {
      await focusTarget.focus();
      const focusState = await focusTarget.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const headerRect = document.querySelector("header")?.getBoundingClientRect();
        return {
          elementTop: rect.top,
          headerBottom: headerRect?.bottom ?? 0,
          hiddenByHeader: rect.bottom <= (headerRect?.bottom ?? 0),
        };
      });
      expect(focusState.hiddenByHeader, `Focused content is obscured by header at ${width}px`).toBe(false);
    }
  });
}

test("write responsive header summary", async () => {
  const rows = viewports.map((width) => {
    const file = path.join(reportDir, `header-${width}.json`);
    const result = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      width,
      overlaps: result.overlaps.length,
      headerHeight: Math.round(result.headerHeight),
      pageOverflow: result.pageOverflow,
    };
  });
  const markdown = [
    "| Viewport | Header height | Overlapping elements | Page overflow |",
    "|---:|---:|---:|:---:|",
    ...rows.map((row) => `| ${row.width}px | ${row.headerHeight}px | ${row.overlaps} | ${row.pageOverflow ? "yes" : "no"} |`),
    "",
    "Contract: single-row header, no page overflow, sticky during vertical scroll, and mobile search remains usable.",
  ].join("\n");
  fs.writeFileSync(path.join(reportDir, "summary.md"), markdown);
  console.log("\n" + markdown);
});
