export const isPersistenceBusy = (status) =>
  status === "saving" || status === "loading";

export const getPersistenceStatusLabel = ({ dirty, status }) => {
  if (status === "saving") return "Saving…";
  if (status === "loading") return "Loading…";
  if (status === "error") return "Couldn’t save";
  if (dirty) return "Unsaved changes";
  if (status === "saved") return "Saved";
  return "Ready";
};

export const getPersistenceErrorTitle = (code) => {
  if (code === "PERSISTENCE_CONFLICT") return "Saved version changed";
  if (code === "CONFIGURATION") return "Persistence is unavailable";
  return "Project action failed";
};

export const getSaveButtonState = ({ dirty, status }) => ({
  disabled: isPersistenceBusy(status) || !dirty,
  label: status === "saving" ? "Saving…" : "Save",
});

export const getProjectListState = ({ projects, status, error }) => {
  if (status === "loading" && !projects) return "loading";
  if (error) return "error";
  if (!projects?.length) return "empty";
  return "ready";
};

export const canReloadSavedVersion = ({ error, currentProjectId }) =>
  error?.code === "PERSISTENCE_CONFLICT" && Boolean(currentProjectId);

export const shouldWarnBeforeNewProject = (dirty) => dirty;

export const getDeleteConfirmationName = (project) =>
  project?.name?.trim() || "Untitled project";
