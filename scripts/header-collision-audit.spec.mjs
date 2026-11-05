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
    "Contract: shared brand and primary-navigation row; workspace-only actions remain separate; no page overflow; sticky header; usable mobile search.",
  ].join("\n");
  fs.writeFileSync(path.join(reportDir, "summary.md"), markdown);
  console.log("\n" + markdown);
});


const publicViewports = [320, 375, 390, 768, 1280];
for (const width of publicViewports) {
  test(`public navigation audit — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/about", { waitUntil: "networkidle" });
    const nav = page.locator('header nav[aria-label="Primary"]');
    const brand = page.getByRole("link", { name: "Ediccrew Tech Stack Architect home" });
    if (width < 1024) {
      const menu = page.getByRole("button", { name: "Menu", exact: true });
      const [brandBox, menuBox] = await Promise.all([brand.boundingBox(), menu.boundingBox()]);
      expect(brandBox && menuBox, `Brand and menu should be visible at ${width}px`).toBeTruthy();
      expect(brandBox.x + brandBox.width, `Menu should remain to the right of the brand at ${width}px`).toBeLessThan(menuBox.x);
      const brandCenterY = brandBox.y + brandBox.height / 2;
      const menuCenterY = menuBox.y + menuBox.height / 2;
      expect(Math.abs(brandCenterY - menuCenterY), `Menu should share the brand row at ${width}px`).toBeLessThan(20);
      await menu.click();
      if (width === 375) {
        await page.keyboard.press("Tab");
        await expect(nav.getByRole("link", { name: "Technologies", exact: true })).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(nav).toBeHidden();
        await expect(menu).toBeFocused();
        await menu.click();
      }
    }
    await expect(nav).toBeVisible();

    for (const label of ["Technologies", "Domains", "Stacks", "Documentation", "About", "Open the Architect"]) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link, `Public navigation link missing at ${width}px: ${label}`).toBeVisible();
      const box = await link.boundingBox();
      expect(box?.height ?? 0, `Touch target below 44px at ${width}px: ${label}`).toBeGreaterThanOrEqual(44);
    }

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      navRight: document.querySelector('header nav[aria-label="Primary"]')?.getBoundingClientRect().right ?? 0,
    }));
    expect(dimensions.documentWidth, `Public page horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 4);
    expect(dimensions.navRight, `Public navigation extends beyond viewport at ${width}px`).toBeLessThanOrEqual(width + 4);
  });
}

test("shared product navigation connects the landing, public documentation, and workspace shells", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const header = page.locator("header.site-header");
  const nav = header.getByRole("navigation", { name: "Primary" });
  const brand = header.getByRole("link", { name: "Ediccrew Tech Stack Architect home" });
  const workspaceSearch = page.locator('input[aria-label="Search workspace navigation"]');

  await expect(header).toBeVisible();
  await expect(nav).toBeVisible();
  await expect(brand).toBeVisible();
  await expect(workspaceSearch).toHaveCount(0);

  await nav.getByRole("link", { name: "Documentation", exact: true }).click();
  await expect(page).toHaveURL(/\/content-detail\/?$/);
  await expect(nav.getByRole("link", { name: "Documentation", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Documentation", exact: true })).toBeVisible();
  await expect(page.locator("#workspace-navigation")).toHaveCount(0);
  await expect(workspaceSearch).toHaveCount(0);

  await nav.getByRole("link", { name: "Open the Architect", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(nav.getByRole("link", { name: "Workspace", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(workspaceSearch).toBeVisible();
  await expect(page.getByRole("button", { name: "Create new project" })).toBeVisible();

  await brand.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(workspaceSearch).toHaveCount(0);
});
