import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.A11Y_AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const expectedStages = [
  "Define your project",
  "Analyze requirements",
  "Review recommendations",
  "Build your technology stack",
  "Design the architecture",
  "Validate the decisions",
  "Create the development plan",
  "Generate the blueprint",
];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const failures = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    try {
      const response = await page.goto(`${baseUrl}/app`, { waitUntil: "networkidle", timeout: 45000 });
      assert.ok(response && response.ok(), `workspace responds successfully at ${viewport.name}`);
      const guide = page.getByRole("region", { name: "Getting started" });
      await guide.waitFor({ state: "visible", timeout: 15000 });

      const stageLinks = guide.locator("ol a");
      assert.equal(await stageLinks.count(), 8, "the guide exposes exactly eight workflow stages");
      for (let index = 0; index < expectedStages.length; index += 1) {
        const link = stageLinks.nth(index);
        await link.waitFor({ state: "visible" });
        assert.ok((await link.innerText()).includes(expectedStages[index]), `stage ${index + 1} is ${expectedStages[index]}`);
      }

      const progress = guide.getByRole("progressbar", { name: "Getting started progress" });
      assert.equal(await progress.getAttribute("aria-valuemin"), "0");
      assert.equal(await progress.getAttribute("aria-valuemax"), "8");
      assert.ok(Number(await progress.getAttribute("aria-valuenow")) >= 0);

      await guide.getByRole("button", { name: "Dismiss getting-started guide" }).click();
      await page.getByRole("button", { name: "Show getting-started guide" }).waitFor({ state: "visible" });
      assert.equal(
        await page.evaluate(() => window.localStorage.getItem("tech-stack-architect:getting-started:dismissed:v1")),
        "true",
        "dismissing the guide persists the dismissed state",
      );

      await page.reload({ waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Show getting-started guide" }).waitFor({ state: "visible" });
      assert.equal(await guide.count(), 0, "the guide remains dismissed after a full reload");

      await page.getByRole("button", { name: "Show getting-started guide" }).click();
      await page.getByRole("region", { name: "Getting started" }).waitFor({ state: "visible" });
      assert.equal(
        await page.evaluate(() => window.localStorage.getItem("tech-stack-architect:getting-started:dismissed:v1")),
        null,
        "reopening clears the persisted dismissed state",
      );

      await page.reload({ waitUntil: "networkidle" });
      const reopenedGuide = page.getByRole("region", { name: "Getting started" });
      await reopenedGuide.waitFor({ state: "visible" });
      assert.equal(await reopenedGuide.locator("ol a").count(), 8, "the reopened guide remains complete after reload");

      await reopenedGuide.getByRole("link", { name: /Review recommendations/ }).click();
      await page.waitForURL("**/app#recommendations");
      assert.equal(new URL(page.url()).hash, "#recommendations", "the Review stage navigates to its workspace destination");

      console.log(`PASS ${viewport.name}: eight stages, progress semantics, dismiss persistence, reopen persistence, and Review navigation`);
    } catch (error) {
      failures.push(`${viewport.name}: ${error instanceof Error ? error.stack : String(error)}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("Workspace onboarding browser acceptance passed for desktop and mobile.");
}
