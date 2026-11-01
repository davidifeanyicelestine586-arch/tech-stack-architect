import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { formatAuditReportHeading } from "./accessibility-report-heading.mjs";
import { renderAccessibilityAuditHtml, shouldFailAccessibilityAudit } from "./accessibility-audit-report.mjs";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const baseUrl = process.env.A11Y_AUDIT_BASE_URL ?? "http://127.0.0.1:3007";
const outputRoot = path.resolve(process.env.A11Y_AUDIT_OUTPUT_ROOT ?? "playwright-report/application-accessibility/current/remaining");
const reportLabel = process.env.A11Y_AUDIT_LABEL;
const failOnFindings = process.env.A11Y_AUDIT_FAIL_ON_FINDINGS === "true";
const viewports = [
  { width: 375, height: 568 },
  { width: 390, height: 700 },
  { width: 414, height: 700 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
];
const pages = [
  { id: "contact", route: "/contact" },
  { id: "privacy", route: "/privacy" },
  { id: "terms", route: "/terms" },
];
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const results = [];

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function auditPage(page, { id, route, width, height, state, navigate = true }) {
  const response = navigate ? await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 45000 }) : null;
  await page.locator("main h1, h1").first().waitFor({ state: "visible", timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.addScriptTag({ path: axePath });
  const axe = await page.evaluate(async (tags) => {
    const result = await window.axe.run(document, { runOnly: { type: "tag", values: tags } });
    return {
      violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) })),
      incomplete: result.incomplete.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })),
    };
  }, axeTags);
  const geometry = await page.evaluate(() => {
    const selector = 'a[href],button,input:not([type="hidden"]),select,textarea,[role="button"],[role="link"],[role="menuitem"],[role="tab"],[role="switch"]';
    const visible = [...document.querySelectorAll(selector)].filter((el) => {
      if (el.closest('[aria-hidden="true"],[inert]')) return false;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    });
    const describe = (el) => ({
      tag: el.tagName.toLowerCase(),
      label: (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 90),
      selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${[...el.classList].slice(0, 2).map((c) => `.${CSS.escape(c)}`).join("")}`,
      rect: (() => { const r=el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom }; })(),
    });
    const targets = visible.map(describe);
    const intersections = [];
    for (let i=0; i<visible.length; i++) for (let j=i+1; j<visible.length; j++) {
      if (visible[i].contains(visible[j]) || visible[j].contains(visible[i])) continue;
      const a=visible[i].getBoundingClientRect(), b=visible[j].getBoundingClientRect();
      const x=Math.min(a.right,b.right)-Math.max(a.left,b.left), y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if (x>3 && y>3) intersections.push({ a:describe(visible[i]), b:describe(visible[j]), overlap:{x,y} });
    }
    return { viewport:{width:innerWidth,height:innerHeight}, document:{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}, targets, intersections };
  });
  const dir = path.join(outputRoot, id);
  await fs.mkdir(dir, { recursive: true });
  const screenshot = path.join(dir, `${state}-${width}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  const keyboard = [];
  if (state === "baseline" && (width === 375 || width === 1440)) {
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      await page.waitForFunction(() => {
        const rect = document.activeElement?.getBoundingClientRect();
        return !rect || (rect.top >= -1 && rect.bottom <= window.innerHeight + 1);
      }, null, { timeout: 1000 }).catch(() => {});
      keyboard.push(await page.evaluate(() => {
        const el = document.activeElement;
        const rect = el?.getBoundingClientRect();
        const style = el ? getComputedStyle(el) : null;
        return {
          tag: el?.tagName.toLowerCase() ?? null,
          label: (el?.getAttribute("aria-label") || el?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70),
          visible: Boolean(rect && rect.width && rect.height && style?.visibility !== "hidden"),
          inViewport: Boolean(rect && rect.top >= -1 && rect.bottom <= innerHeight + 1),
          focusIndicator: Boolean(style && (style.outlineStyle !== "none" || style.boxShadow !== "none")),
        };
      }));
    }
  }
  results.push({ id, route, state, width, height, httpStatus: response?.status() ?? 200, axe, geometry, keyboard, screenshot });
}

try {
  for (const viewport of viewports) {
    for (const target of pages) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await auditPage(page, { ...target, ...viewport, state: "baseline" });
      await context.close();
    }

    // Public primary navigation closed and open. The expanded menu is an intentional overlay state.
    {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await auditPage(page, { id:"shared-public-nav", route:"/", ...viewport, state:"closed" });
      const menu = page.getByRole("button", { name: "Menu" });
      if (await menu.isVisible().catch(() => false)) {
        await menu.click();
        await page.getByRole("button", { name: "Close menu" }).waitFor({ state:"visible", timeout:5000 });
        await auditPage(page, { id:"shared-public-nav", route:"/", ...viewport, state:"open", navigate:false });
      }
      await context.close();
    }

    // Sign-in dialog and create-account mode, including axe checks in modal state.
    {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await auditPage(page, { id:"shared-auth-dialog", route:"/app", ...viewport, state:"closed" });
      const trigger = page.getByRole("button", { name: "Sign in" });
      await trigger.waitFor({ state:"visible", timeout:10000 });
      await trigger.click();
      await page.getByRole("dialog").waitFor({ state:"visible", timeout:10000 });
      await auditPage(page, { id:"shared-auth-dialog", route:"/app", ...viewport, state:"sign-in", navigate:false });
      const create = page.getByRole("button", { name: "Create account" });
      if (await create.isVisible().catch(() => false)) {
        await create.click();
        await page.getByRole("heading", { name: "Create your account" }).waitFor({ state:"visible", timeout:5000 });
        await auditPage(page, { id:"shared-auth-dialog", route:"/app", ...viewport, state:"sign-up", navigate:false });
      }
      await page.keyboard.press("Escape");
      const sidebar = page.getByRole("button", { name: /Toggle (mobile )?workspace navigation/ });
      await sidebar.waitFor({ state:"visible", timeout:5000 });
      const sidebarBefore = await sidebar.getAttribute("aria-expanded");
      await sidebar.click();
      await page.waitForFunction((before) => {
        const control = document.querySelector('button[aria-label*="Toggle"][aria-expanded]');
        return control && control.getAttribute("aria-expanded") !== before;
      }, sidebarBefore, { timeout:5000 });
      await page.waitForTimeout(350);
      await auditPage(page, { id:"shared-workspace-sidebar", route:"/app", ...viewport, state:"toggled", navigate:false });
      await context.close();
    }
  }

  const summary = {
    baseUrl,
    viewports,
    pages: pages.map((p) => p.route),
    resultCount: results.length,
    violations: results.flatMap((r) => r.axe.violations.map((v) => ({ route:r.route, state:r.state, width:r.width, id:v.id, impact:v.impact, nodes:v.nodes.length }))),
    incomplete: results.flatMap((r) => r.axe.incomplete.map((v) => ({ route:r.route, state:r.state, width:r.width, id:v.id, nodes:v.nodes.length }))),
    geometryFindings: results.flatMap((r) => [
      ...(r.geometry.document.scrollWidth > r.geometry.document.clientWidth ? [{route:r.route,state:r.state,width:r.width,type:"document-overflow",extra:r.geometry.document}] : []),
      ...r.geometry.intersections.map((x) => ({route:r.route,state:r.state,width:r.width,type:"intersection",extra:x})),
      ...r.geometry.targets.filter((t) => t.rect.x < -1 || t.rect.right > r.geometry.viewport.width+1).map((t) => ({route:r.route,state:r.state,width:r.width,type:"horizontal-clipping",extra:t})),
    ]),
    results,
  };
  await fs.writeFile(path.join(outputRoot, "remaining-audit.json"), JSON.stringify(summary, null, 2));
  const reportHeading = formatAuditReportHeading(reportLabel);
  const lines = [reportHeading, "", `Audited ${results.length} route/state/viewport combinations.`, "", "| Route / state | Width | HTTP | Axe violations | Intersections | Document overflow |", "|---|---:|---:|---:|---:|---:|"];
  for (const r of results) lines.push(`| ${r.route} · ${r.state} | ${r.width} | ${r.httpStatus} | ${r.axe.violations.length} | ${r.geometry.intersections.length} | ${r.geometry.document.scrollWidth>r.geometry.document.clientWidth ? "yes" : "no"} |`);
  lines.push("", `Unique axe issues: ${[...new Set(summary.violations.map((v)=>v.id))].join(", ") || "none"}.`, `Axe incomplete checks: ${summary.incomplete.length}.`, `Geometry findings: ${summary.geometryFindings.length}.`, "", "The open primary menu and open authentication dialog were treated as intentional overlay states. This is an automated/manual audit snapshot, not formal WCAG certification.");
  const markdown = lines.join("\n");
  await fs.writeFile(path.join(outputRoot, "remaining-audit.md"), markdown);
  await fs.writeFile(path.join(outputRoot, "remaining-audit.html"), renderAccessibilityAuditHtml(summary, reportHeading, outputRoot));
  console.log(markdown);
  if (shouldFailAccessibilityAudit(summary, failOnFindings)) {
    console.error(`Accessibility regression audit failed: ${summary.violations.length} axe violation(s), ${summary.geometryFindings.length} geometry finding(s).`);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
