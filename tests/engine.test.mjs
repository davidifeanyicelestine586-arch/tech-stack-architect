import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import TechStackArchitect from "../engine/TechStackArchitect.js";
import DependencyEngine from "../engine/dependencyEngine.js";
import RecipeEngine from "../engine/recipeEngine.js";
import Exporter from "../engine/exporter.js";

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));
const domains = readJson("../data/domain.json");
const components = readJson("../data/components.json");
const recipes = readJson("../data/recipes.json");
const createArchitect = () => new TechStackArchitect({ domains, components, recipes });

test("empty stack has a clear empty status and is not valid", () => {
  const report = createArchitect().validate([]);

  assert.equal(report.score, 100);
  assert.equal(report.status, "No Stack");
  assert.equal(report.valid, false);
  assert.deepEqual(report.dependencyReport.missing, []);
});

test("fully resolved Next.js stack is valid and production ready", () => {
  const report = createArchitect().validate(["nextjs", "nodejs", "vercel"]);

  assert.equal(report.valid, true);
  assert.equal(report.status, "Production Ready");
  assert.deepEqual(report.dependencyReport.missing, []);
  assert.equal(report.conflictReport.hasConflicts, false);
});

test("missing required dependencies make a stack invalid", () => {
  const report = createArchitect().validate(["nextjs"]);

  assert.deepEqual(report.dependencyReport.missing, ["nodejs", "vercel"]);
  assert.equal(report.valid, false);
  assert.equal(report.status, "Needs Review");
});

test("declared component conflicts and hardware pin conflicts remain detectable", () => {
  const report = createArchitect().validate(["l298n", "hc-sr04"]);

  assert.equal(report.conflictReport.hasConflicts, true);
  assert.equal(report.conflictReport.componentConflicts.length, 1);
  assert.equal(report.conflictReport.componentConflicts[0].target, "l298n");
  assert.equal(report.conflictReport.pinConflicts.length, 1);
  assert.equal(report.conflictReport.pinConflicts[0].pin, "9");
  assert.equal(report.valid, false);
});

test("explicit MCP security rule remains enforced", () => {
  const report = createArchitect().validate(["mcp-server"]);

  assert.ok(report.conflictReport.ruleViolations.some((rule) => rule.rule === "Insecure Token Storage"));
  assert.equal(report.valid, false);
});

test("dependency engine reports required, optional, and missing dependencies", () => {
  const engine = new DependencyEngine(components);
  const report = engine.analyze(["nextjs"]);

  assert.deepEqual(report.required, ["nodejs", "vercel"]);
  assert.deepEqual(report.optional, ["tailwindcss", "typescript"]);
  assert.deepEqual(report.missing, ["nodejs", "vercel"]);
});

test("automatic dependency resolution returns the selected stack plus missing dependencies", () => {
  const selected = createArchitect().resolveMissingDependencies(["nextjs"]);

  assert.deepEqual(selected, ["nextjs", "nodejs", "vercel"]);
});

test("recipe engine scores and recommends recipes from selected components", () => {
  const engine = new RecipeEngine(recipes, components);
  const paymentRecipe = engine.getRecipe("bootstrapped-payment-dashboard");

  assert.equal(engine.calculateMatch(paymentRecipe, ["nextjs"]), 50);
  const recommendations = engine.recommend(["nextjs", "sqlite"]);
  assert.equal(recommendations[0].recipe.id, "bootstrapped-payment-dashboard");
  assert.equal(recommendations[0].score, 100);
});

test("recipe application produces a blueprint and validates the selected recipe stack", () => {
  const result = createArchitect().build({
    recipe: "bootstrapped-payment-dashboard",
    selectedComponents: ["nextjs", "sqlite", "nodejs", "vercel", "local-filesystem"],
  });

  assert.equal(result.blueprint.title, "Bootstrapped Payment Dashboard");
  assert.equal(result.report.valid, true);
  assert.deepEqual(result.report.dependencyReport.missing, []);
});

test("exporter produces JSON and Markdown representations", () => {
  const exporter = new Exporter();
  const report = {
    title: "Example Blueprint",
    score: 95,
    status: "Production Ready",
    domain: "web-saas",
    components: [{ name: "Next.js" }],
    learningGoals: ["Server-side rendering"],
    outputs: ["architecture"],
    warnings: [],
    suggestions: [],
    starterCommands: ["npm run dev"],
  };

  const json = exporter.exportJSON(report);
  assert.deepEqual(JSON.parse(json), report);
  const markdown = exporter.exportMarkdown(report);
  assert.match(markdown, /# Example Blueprint/);
  assert.match(markdown, /Production Ready/);
  assert.match(markdown, /Next\.js/);
  assert.match(markdown, /npm run dev/);
});
