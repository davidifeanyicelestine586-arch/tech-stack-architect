import assert from "node:assert/strict";
import test from "node:test";
import { generateArchitecture, getArchitectureSourceSignature } from "../engine/architecture/architecture-generator.js";
import { validateArchitecture } from "../engine/architecture/architecture-validator.js";
import { generateDevelopmentPlan, getDevelopmentPlanSourceSignature } from "../engine/planning/development-planner.js";
import Exporter from "../engine/exporter.js";

const project = {
  name: "Document Q&A",
  description: "A SaaS application for document questions.",
  domain: "web-saas",
  difficulty: "Intermediate",
  requirements: "upload PDFs, ask questions, deploy",
};

const selectedComponents = [
  { id: "nextjs", name: "Next.js", category: "Frontend Framework", description: "Web application framework.", requires: ["nodejs"] },
  { id: "nodejs", name: "Node.js", category: "Runtime", description: "JavaScript runtime.", requires: [] },
  { id: "sqlite", name: "SQLite", category: "Database", description: "Embedded SQL database.", requires: ["local-filesystem"] },
  { id: "local-filesystem", name: "Local Filesystem", category: "Storage", description: "Persistent file storage.", requires: [] },
  { id: "vercel", name: "Vercel", category: "Hosting", description: "Application hosting.", requires: [] },
];

test("architecture generation uses selected registry entries and declared dependencies", () => {
  const architecture = generateArchitecture({ project, selectedComponents });

  assert.equal(architecture.components.length, selectedComponents.length);
  assert.equal(architecture.relationships.length, 2);
  assert.ok(architecture.relationships.some((edge) => edge.sourceId === "technology-nextjs" && edge.targetId === "technology-nodejs"));
  assert.ok(architecture.relationships.some((edge) => edge.sourceId === "technology-sqlite" && edge.targetId === "technology-local-filesystem"));
  assert.ok(architecture.assumptions.length > 0);
});

test("architecture validation reports dependencies missing from the selected stack", () => {
  const incomplete = [selectedComponents[0]];
  const architecture = generateArchitecture({ project, selectedComponents: incomplete });
  const report = validateArchitecture({ project, architecture, selectedComponents: incomplete });

  assert.equal(report.valid, false);
  assert.ok(report.findings.some((finding) => finding.code === "MISSING_TECHNOLOGY_DEPENDENCY" && finding.severity === "error"));
});

test("architecture validation identifies requirement coverage gaps without claiming production readiness", () => {
  const securedProject = { ...project, requirements: "user login, authentication, subscriptions and payment checkout" };
  const architecture = generateArchitecture({ project: securedProject, selectedComponents });
  const report = validateArchitecture({ project: securedProject, architecture, selectedComponents });

  assert.ok(report.findings.some((finding) => finding.code === "AUTHENTICATION_COVERAGE"));
  assert.ok(report.findings.some((finding) => finding.code === "PAYMENT_COVERAGE"));
  assert.notEqual(report.status, "Production Ready");
});

test("development planning derives phases, tasks, acceptance criteria and deliverables from architecture", () => {
  const architecture = generateArchitecture({ project, selectedComponents });
  const validation = validateArchitecture({ project, architecture, selectedComponents });
  const plan = generateDevelopmentPlan({ project, architecture, validation });

  assert.ok(plan.phases.length >= 2);
  assert.equal(plan.tasks.length, architecture.components.length + 2 + validation.findings.filter((finding) => finding.severity === "error" || finding.severity === "warning").length);
  assert.ok(plan.tasks.every((task) => task.acceptanceCriteria.length > 0));
  assert.ok(plan.tasks.every((task) => task.deliverables.length > 0));
  assert.ok(plan.phases.every((phase) => phase.taskIds.every((id) => plan.tasks.some((task) => task.id === id))));
});

test("Markdown blueprint export includes architecture findings and development tasks", () => {
  const architecture = generateArchitecture({ project, selectedComponents });
  const validation = validateArchitecture({ project, architecture, selectedComponents });
  const plan = generateDevelopmentPlan({ project, architecture, validation });
  const markdown = new Exporter().exportMarkdown({
    title: project.name,
    domain: project.domain,
    components: selectedComponents,
    warnings: [],
    suggestions: [],
    starterCommands: [],
    learningGoals: [],
    outputs: [],
    project,
    architecture,
    architectureValidation: validation,
    developmentPlan: plan,
  });

  assert.match(markdown, /## Architecture Specification/);
  assert.match(markdown, /## Architecture Validation/);
  assert.match(markdown, /## Development Roadmap/);
  assert.match(markdown, /Implement Next.js/);
});

test("source signatures detect upstream project, stack, and architecture changes", () => {
  const signature = getArchitectureSourceSignature(project, selectedComponents);
  assert.equal(signature, getArchitectureSourceSignature(project, [...selectedComponents].reverse()));
  assert.notEqual(signature, getArchitectureSourceSignature({ ...project, requirements: "different requirements" }, selectedComponents));

  const architecture = generateArchitecture({ project, selectedComponents });
  const planSignature = getDevelopmentPlanSourceSignature(project, architecture);
  const editedArchitecture = {
    ...architecture,
    components: architecture.components.map((component) => component.id === "technology-nextjs"
      ? { ...component, responsibility: "Edited responsibility." }
      : component),
  };
  assert.notEqual(planSignature, getDevelopmentPlanSourceSignature(project, editedArchitecture));
});

test("user review confirmations are retained as explicit architecture decisions", () => {
  const architecture = generateArchitecture({
    project,
    selectedComponents,
    answers: { dataFlowReviewed: true, securityReviewed: true },
  });

  assert.ok(architecture.decisions.some((decision) => decision.id === "decision-data-flow-review"));
  assert.ok(architecture.decisions.some((decision) => decision.id === "decision-security-review"));
  assert.equal(architecture.decisions.find((decision) => decision.id === "decision-architecture-style")?.status, "proposed");
  assert.ok(!architecture.unresolvedQuestions.some((question) => question.includes("data flow")));
  assert.ok(!architecture.unresolvedQuestions.some((question) => question.includes("identity")));
});

test("architecture style and deployment decisions require explicit approval", () => {
  const architecture = generateArchitecture({
    project,
    selectedComponents,
    answers: { architectureStyleApproved: true, deploymentModelApproved: true },
  });
  assert.equal(architecture.decisions.find((decision) => decision.id === "decision-architecture-style")?.status, "approved");
  assert.equal(architecture.decisions.find((decision) => decision.id === "decision-deployment-model")?.status, "approved");
});

test("architecture validation distinguishes unapproved proposals from approved decisions", () => {
  const proposal = generateArchitecture({ project, selectedComponents });
  const proposalReport = validateArchitecture({ project, architecture: proposal, selectedComponents });
  assert.ok(proposalReport.findings.some((finding) => finding.code === "UNAPPROVED_ARCHITECTURE_DECISIONS"));

  const approved = generateArchitecture({
    project,
    selectedComponents,
    answers: {
      architectureStyleApproved: true,
      deploymentModelApproved: true,
      dataFlowReviewed: true,
      securityReviewed: true,
    },
  });
  const approvedReport = validateArchitecture({ project, architecture: approved, selectedComponents });
  assert.ok(!approvedReport.findings.some((finding) => finding.code === "UNAPPROVED_ARCHITECTURE_DECISIONS"));
});
