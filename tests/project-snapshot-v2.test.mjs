import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProjectSnapshot } from "../lib/persistence/project-serialization.js";

const legacySnapshot = () => ({
  schemaVersion: 1,
  projectDefinition: {
    name: "AI Document Q&A Platform",
    description: "A SaaS application for document questions.",
    domain: "web-saas",
    difficulty: "Intermediate",
    requirements: "upload PDFs, ask questions, deploy",
  },
  selectedComponentIds: ["nextjs", "nodejs", "vercel"],
  activeRecipeId: "bootstrapped-payment-dashboard",
});

test("legacy V1 projects migrate to V2 without losing existing project decisions", () => {
  const migrated = normalizeProjectSnapshot(legacySnapshot());

  assert.deepEqual(migrated, {
    schemaVersion: 2,
    projectDefinition: legacySnapshot().projectDefinition,
    selectedComponentIds: ["nextjs", "nodejs", "vercel"],
    activeRecipeId: "bootstrapped-payment-dashboard",
    architecture: null,
    developmentPlan: null,
  });
});

const architecture = {
  schemaVersion: 1,
  sourceSignature: "test-project-stack-signature",
  components: [
    { id: "web", name: "Web client", type: "client", responsibility: "Render the user interface.", technologyIds: ["nextjs"] },
    { id: "api", name: "Application API", type: "api", responsibility: "Handle application requests.", technologyIds: ["nodejs"] },
  ],
  relationships: [
    { id: "web-api", sourceId: "web", targetId: "api", relationshipType: "https", description: "The client calls the application API." },
  ],
  decisions: [
    { id: "api-boundary", title: "API boundary", decision: "Use a dedicated API layer.", rationale: "Keep transport concerns separate from business logic.", alternatives: ["Server actions"] },
  ],
  assumptions: ["The first release is a single-owner application."],
  unresolvedQuestions: ["Which external identity provider will be used?"],
};

const developmentPlan = {
  schemaVersion: 1,
  sourceSignature: "test-project-architecture-signature",
  milestones: [
    { id: "mvp", title: "MVP complete", description: "The core workflow is usable.", completionCriteria: ["Users can create and save a project."] },
  ],
  phases: [
    { id: "foundation", title: "Foundation", objective: "Establish the application foundation.", deliverables: ["Project shell"], dependsOn: [], milestoneIds: ["mvp"], taskIds: ["setup"] },
  ],
  tasks: [
    { id: "setup", title: "Initialize project", description: "Create the application workspace.", phaseId: "foundation", componentIds: ["web"], dependsOn: [], acceptanceCriteria: ["The app starts locally."], deliverables: ["Runnable application"], suggestedTests: ["Smoke-test the home route."], learningResources: ["Next.js documentation"] },
  ],
};

test("V2 snapshots preserve structured architecture and development plans", () => {
  const migrated = normalizeProjectSnapshot({
    ...legacySnapshot(),
    schemaVersion: 2,
    architecture,
    developmentPlan,
  });

  assert.deepEqual(migrated.architecture, architecture);
  assert.deepEqual(migrated.developmentPlan, developmentPlan);
});

test("architecture relationships cannot reference missing components", () => {
  assert.throws(() => normalizeProjectSnapshot({
    ...legacySnapshot(),
    schemaVersion: 2,
    architecture: {
      ...architecture,
      relationships: [{ ...architecture.relationships[0], targetId: "missing" }],
    },
    developmentPlan: null,
  }), /existing components/);
});

test("development task dependency cycles are rejected", () => {
  assert.throws(() => normalizeProjectSnapshot({
    ...legacySnapshot(),
    schemaVersion: 2,
    architecture,
    developmentPlan: {
      ...developmentPlan,
      phases: [{ ...developmentPlan.phases[0], taskIds: ["first", "second"] }],
      tasks: [
        { ...developmentPlan.tasks[0], id: "first", dependsOn: ["second"] },
        { ...developmentPlan.tasks[0], id: "second", dependsOn: ["first"] },
      ],
    },
  }), /cannot contain cycles/);
});
