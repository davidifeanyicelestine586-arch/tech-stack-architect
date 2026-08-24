import {
  normalizeProjectSnapshot,
  validateProjectSnapshot,
} from "../project-serialization.js";
import { ProjectPersistenceApiError } from "./project-persistence-client.js";

const safeError = (error) => {
  if (error instanceof ProjectPersistenceApiError) {
    return { code: error.code, message: error.message };
  }
  return {
    code: "PERSISTENCE_UNAVAILABLE",
    message: "Project persistence is temporarily unavailable.",
  };
};

const normalizeLoadedSnapshot = (snapshot, registries) => {
  const validation = validateProjectSnapshot(snapshot, registries);
  if (!validation.valid) {
    const error = new ProjectPersistenceApiError(
      "MALFORMED_RECORD",
      "The server returned an invalid project snapshot."
    );
    throw error;
  }
  return normalizeProjectSnapshot(validation.snapshot);
};

export const createProviderPersistenceController = ({
  client,
  registries,
  getCanonicalSnapshot,
  getCurrentProjectIdentity,
  setPersistenceStatus,
  setPersistenceError,
  applyLoadedProject,
  applySavedIdentity,
  markPersistenceSaved = (snapshot) => {
    void snapshot;
  },
  clearDeletedIdentity,
}) => {
  const fail = (error) => {
    const mapped = safeError(error);
    setPersistenceError(mapped);
    setPersistenceStatus("error");
    throw error instanceof ProjectPersistenceApiError
      ? error
      : new ProjectPersistenceApiError(mapped.code, mapped.message);
  };

  const saveProject = async () => {
    setPersistenceStatus("saving");
    setPersistenceError(null);

    try {
      const snapshot = getCanonicalSnapshot();
      const identity = getCurrentProjectIdentity();
      const record =
        identity.id && identity.revision !== null
          ? await client.update(identity.id, snapshot, identity.revision)
          : await client.create(snapshot);
      applySavedIdentity(record);
      markPersistenceSaved(snapshot);
      setPersistenceStatus("saved");
    } catch (error) {
      fail(error);
    }
  };

  const loadProject = async (projectId) => {
    setPersistenceStatus("loading");
    setPersistenceError(null);

    try {
      const record = await client.get(projectId);
      const snapshot = normalizeLoadedSnapshot(record.snapshot, registries);
      applyLoadedProject({ record, snapshot });
      setPersistenceStatus("saved");
    } catch (error) {
      fail(error);
    }
  };

  const listProjects = async () => {
    setPersistenceStatus("loading");
    setPersistenceError(null);

    try {
      const projects = await client.list();
      setPersistenceStatus("idle");
      return projects;
    } catch (error) {
      fail(error);
    }
  };

  const deleteProject = async (projectId) => {
    setPersistenceStatus("saving");
    setPersistenceError(null);

    try {
      await client.remove(projectId);
      clearDeletedIdentity(projectId);
      setPersistenceStatus("idle");
    } catch (error) {
      fail(error);
    }
  };

  return { saveProject, loadProject, listProjects, deleteProject };
};
