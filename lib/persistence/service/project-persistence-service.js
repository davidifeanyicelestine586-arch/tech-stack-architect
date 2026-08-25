import { PersistenceError } from "../project-serialization.js";

const mapUnexpectedError = (error, operation) => {
  if (error instanceof PersistenceError) return error;

  const mapped = new PersistenceError(
    "DATABASE_FAILURE",
    `Unable to ${operation} project.`,
    { errors: ["The persistence operation failed."] }
  );
  mapped.internal = { cause: error, operation };
  return mapped;
};

export class ProjectPersistenceService {
  constructor({ repository }) {
    if (!repository) {
      throw new PersistenceError(
        "PERSISTENCE_UNAVAILABLE",
        "A project repository is required for persistence operations."
      );
    }
    this.repository = repository;
  }

  async createProject({ scope, snapshot }) {
    try {
      return await this.repository.createProject({ scope, snapshot });
    } catch (error) {
      throw mapUnexpectedError(error, "create");
    }
  }

  async getProject({ scope, id }) {
    try {
      return await this.repository.getProject({ scope, id });
    } catch (error) {
      throw mapUnexpectedError(error, "load");
    }
  }

  async listProjects({ scope }) {
    try {
      return await this.repository.listProjects({ scope });
    } catch (error) {
      throw mapUnexpectedError(error, "list");
    }
  }

  async updateProject({ scope, id, expectedRevision, snapshot }) {
    try {
      return await this.repository.updateProject({
        scope,
        id,
        expectedRevision,
        snapshot,
      });
    } catch (error) {
      throw mapUnexpectedError(error, "update");
    }
  }

  async deleteProject({ scope, id }) {
    try {
      return await this.repository.deleteProject({ scope, id });
    } catch (error) {
      throw mapUnexpectedError(error, "delete");
    }
  }
}
