import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import TechStackArchitect from "../engine/TechStackArchitect.js";
import {
  createProjectDefinition,
  validateProjectDefinition,
} from "../engine/requirementAnalyzer.js";

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));
const domains = readJson("../data/domain.json");
const components = readJson("../data/components.json");
const recipes = readJson("../data/recipes.json");
const createArchitect = () => new TechStackArchitect({ domains, components, recipes });

const exampleProject = createProjectDefinition({
  name: "AI Document Q&A Platform",
  description: "A SaaS application where users upload PDF documents and ask questions about their contents.",
  domain: "ai-automation",
  difficulty: "Intermediate",
  requirements: "web application, document upload, PDF processing, AI question answering, data storage, deployment",
});

test("project definition is normalized and required fields are enforced", () => {
  const project = createProjectDefinition({
    name: "  Example Project  ",
    description: "  A local prototype.  ",
    domain: "web-saas",
    difficulty: "Advanced",
    requirements: "  local files  ",
  });

  assert.equal(project.name, "Example Project");
  assert.equal(project.description, "A local prototype.");
  assert.equal(project.difficulty, "Advanced");
  assert.equal(validateProjectDefinition(project).valid, true);
  assert.equal(validateProjectDefinition(createProjectDefinition()).valid, false);
});

test("analysis respects the selected domain and difficulty preference", () => {
  const analyzer = createArchitect();
  const analysis = analyzer.analyzeRequirements(
    createProjectDefinition({
      name: "Beginner web prototype",
      description: "A small website with database storage and deployment.",
      domain: "web-saas",
      difficulty: "Beginner",
      requirements: "web application database deployment",
    })
  );

  assert.ok(analysis.recommendations.length > 0);
  assert.equal(analysis.recommendations.every(({ component }) => components.some((item) => item.id === component.id)), true);
  assert.equal(analysis.recommendations[0].component.domain, "web-saas");
  assert.ok(analysis.recommendations.some(({ component }) => component.difficulty === "Beginner"));
});

test("example analysis detects registry terms and provides explanations", () => {
  const analysis = createArchitect().analyzeRequirements(exampleProject);
  const names = analysis.recommendations.map(({ component }) => component.id);

  assert.ok(analysis.matchedTerms.includes("ai"));
  assert.ok(analysis.matchedTerms.includes("saas"));
  assert.ok(names.includes("ai-stacker"));
  assert.ok(names.includes("llm-gateway"));
  assert.ok(analysis.recommendations.every(({ reasons }) => reasons.length > 0));
});

test("unknown concepts never invent components outside the registry", () => {
  const analysis = createArchitect().analyzeRequirements(
    createProjectDefinition({
      name: "Quantum Teleporter",
      description: "A project for a quantum teleporter with an impossible fictional subsystem.",
      domain: "mechatronics",
      difficulty: "Advanced",
      requirements: "quantum teleporter fictional subsystem",
    })
  );
  const registryIds = new Set(components.map((component) => component.id));

  assert.ok(analysis.recommendations.every(({ component }) => registryIds.has(component.id)));
  assert.equal(analysis.recommendations.some(({ component }) => component.name.toLowerCase().includes("teleporter")), false);
});

test("matching metadata ranks above an unrelated registered component", () => {
  const analysis = createArchitect().analyzeRequirements(exampleProject);
  const aiStacker = analysis.recommendations.find(({ component }) => component.id === "ai-stacker");
  const servo = analysis.recommendations.find(({ component }) => component.id === "servo-motor");

  assert.ok(aiStacker);
  assert.ok(servo);
  assert.ok(aiStacker.score > servo.score);
  assert.ok(aiStacker.matchedTerms.includes("ai"));
});

test("declared conflicts are identified as incompatible recommendations", () => {
  const analysis = createArchitect().analyzeRequirements(
    createProjectDefinition({
      name: "Obstacle robot",
      description: "A hardware robot that detects obstacles.",
      domain: "mechatronics",
      difficulty: "Intermediate",
      requirements: "robot obstacle detection motor",
    })
  );
  const l298n = analysis.recommendations.find(({ component }) => component.id === "l298n");

  assert.ok(l298n);
  assert.equal(l298n.compatible, false);
  assert.ok(l298n.declaredConflicts.includes("hc-sr04"));
});

test("analysis is deterministic and integrates with existing validation", () => {
  const architect = createArchitect();
  const first = architect.analyzeRequirements(exampleProject);
  const second = architect.analyzeRequirements(exampleProject);
  const selected = first.recommendations.find(({ component }) => component.id === "mcp-server");

  assert.deepEqual(first, second);
  assert.ok(selected);
  const report = architect.validate([selected.component.id]);
  assert.equal(report.valid, false);
  assert.ok(report.dependencyReport.missing.includes("llm-gateway"));
});

test("blueprint exports retain project definition and validation context", () => {
  const architect = createArchitect();
  const selectedIds = ["nextjs", "nodejs", "vercel"];
  const report = architect.validate(selectedIds);
  const project = createProjectDefinition({
    ...exampleProject,
    domain: "web-saas",
    difficulty: "Intermediate",
  });
  const mergedReport = {
    title: project.name,
    domain: project.domain,
    components: selectedIds.map((id) => components.find((component) => component.id === id)),
    project,
    validation: {
      valid: report.valid,
      score: report.score,
      status: report.status,
      missingDependencies: report.dependencyReport.missing,
      conflicts: [],
    },
  };
  const markdown = architect.export("markdown", mergedReport);
  const json = JSON.parse(architect.export("json", mergedReport));

  assert.match(markdown, /AI Document Q&A Platform/);
  assert.match(markdown, /Validation Details/);
  assert.equal(json.project.domain, "web-saas");
  assert.equal(json.validation.status, "Production Ready");
});
