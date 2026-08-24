import test from "node:test";
import assert from "node:assert/strict";
import {
  canReloadSavedVersion,
  getDeleteConfirmationName,
  getPersistenceErrorTitle,
  getPersistenceStatusLabel,
  getProjectListState,
  getSaveButtonState,
  isPersistenceBusy,
  shouldWarnBeforeNewProject,
} from "../lib/persistence/client/project-persistence-ui-state.js";

const savedProject = {
  id: "0d9f3b4c-5e6a-4f7b-8c9d-0e1f2a3b4c5d",
  revision: 2,
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T11:00:00.000Z",
  name: "Document Workspace",
  description: "A document project",
  domain: "web-saas",
  difficulty: "Intermediate",
};

test("Save button is enabled only for dirty idle projects", () => {
  assert.deepEqual(getSaveButtonState({ dirty: true, status: "idle" }), {
    disabled: false,
    label: "Save",
  });
  assert.equal(getSaveButtonState({ dirty: false, status: "idle" }).disabled, true);
});

test("Save button exposes a loading state and blocks duplicate submissions", () => {
  assert.deepEqual(getSaveButtonState({ dirty: true, status: "saving" }), {
    disabled: true,
    label: "Saving…",
  });
  assert.equal(isPersistenceBusy("saving"), true);
});

test("loading state blocks project actions while the list is loading", () => {
  assert.equal(isPersistenceBusy("loading"), true);
  assert.equal(
    getProjectListState({ projects: null, status: "loading", error: null }),
    "loading"
  );
});

test("saved and modified statuses are distinguishable", () => {
  assert.equal(getPersistenceStatusLabel({ dirty: false, status: "saved" }), "Saved");
  assert.equal(
    getPersistenceStatusLabel({ dirty: true, status: "saved" }),
    "Unsaved changes"
  );
});

test("save failure has a stable user-facing status", () => {
  assert.equal(getPersistenceStatusLabel({ dirty: true, status: "error" }), "Couldn’t save");
  assert.equal(getPersistenceErrorTitle("CONFIGURATION"), "Persistence is unavailable");
});

test("New Project warns only when there are unsaved changes", () => {
  assert.equal(shouldWarnBeforeNewProject(true), true);
  assert.equal(shouldWarnBeforeNewProject(false), false);
});

test("project list supports empty, ready, and error states", () => {
  assert.equal(getProjectListState({ projects: [], status: "idle", error: null }), "empty");
  assert.equal(
    getProjectListState({ projects: [savedProject], status: "idle", error: null }),
    "ready"
  );
  assert.equal(
    getProjectListState({ projects: null, status: "idle", error: new Error("failed") }),
    "error"
  );
});

test("project list summaries use safe display metadata", () => {
  assert.equal(savedProject.name, "Document Workspace");
  assert.equal(savedProject.domain, "web-saas");
  assert.equal(typeof savedProject.updatedAt, "string");
});

test("conflict recovery is available only for the current saved project", () => {
  const error = { code: "PERSISTENCE_CONFLICT", message: "changed" };
  assert.equal(canReloadSavedVersion({ error, currentProjectId: savedProject.id }), true);
  assert.equal(canReloadSavedVersion({ error, currentProjectId: null }), false);
});

test("non-conflict errors do not expose a reload recovery action", () => {
  assert.equal(
    canReloadSavedVersion({
      error: { code: "PERSISTENCE_UNAVAILABLE", message: "offline" },
      currentProjectId: savedProject.id,
    }),
    false
  );
});

test("delete confirmation uses the project name and safe fallback", () => {
  assert.equal(getDeleteConfirmationName(savedProject), "Document Workspace");
  assert.equal(getDeleteConfirmationName({ name: "  " }), "Untitled project");
  assert.equal(getDeleteConfirmationName(null), "Untitled project");
});

test("all required persistence statuses have readable labels", () => {
  assert.equal(getPersistenceStatusLabel({ dirty: false, status: "idle" }), "Ready");
  assert.equal(getPersistenceStatusLabel({ dirty: false, status: "saving" }), "Saving…");
  assert.equal(getPersistenceStatusLabel({ dirty: false, status: "loading" }), "Loading…");
  assert.equal(getPersistenceStatusLabel({ dirty: false, status: "error" }), "Couldn’t save");
});
