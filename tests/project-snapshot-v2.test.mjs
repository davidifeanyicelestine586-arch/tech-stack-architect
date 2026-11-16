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
