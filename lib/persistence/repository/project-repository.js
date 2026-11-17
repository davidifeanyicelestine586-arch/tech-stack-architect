import {
  PersistenceError,
  deserializeProjectRecord,
  serializeProjectSnapshot,
  validateProjectSnapshot,
} from "../project-serialization.js";

const PROJECT_COLUMNS = [
  "id",
  "name",
  "description",
  "domain_id",
  "difficulty",
  "requirements",
  "selected_component_ids",
  "active_recipe_id",
  "architecture",
  "development_plan",
  "schema_version",
  "revision",
  "created_at",
  "updated_at",
  "owner_id",
  "anonymous_session_id",
  "workspace_id",
  "visibility",
].join(", ");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === "string" && UUID_PATTERN.test(value);

const withCause = (error, cause, operation) => {
  error.internal = { cause, operation };
  return error;
};

const mapDatabaseError = (cause, operation) =>
  withCause(
    new PersistenceError(
      "DATABASE_FAILURE",
      `Unable to ${operation} project.`,
      { errors: ["The persistence database operation failed."] }
    ),
    cause,
    operation
  );

const assertScope = (scope) => {
  if (!scope || typeof scope !== "object") {
    throw new PersistenceError(
      "UNAUTHORIZED",
      "A persistence scope is required to access projects."
    );
  }

  if (scope.kind === "anonymous" && isUuid(scope.sessionId)) {
    return {
      kind: scope.kind,
      column: "anonymous_session_id",
      value: scope.sessionId,
    };
  }

  if (scope.kind === "user" && isUuid(scope.userId)) {
    return { kind: scope.kind, column: "owner_id", value: scope.userId };
  }

  if (scope.kind === "workspace" && isUuid(scope.userId) && isUuid(scope.workspaceId)) {
    return { kind: scope.kind, userId: scope.userId, workspaceId: scope.workspaceId };
  }

  throw new PersistenceError(
    "UNAUTHORIZED",
    "The supplied persistence scope is invalid."
  );
};

const assertProjectId = (id) => {
  if (!isUuid(id)) {
    throw new PersistenceError("UNAUTHORIZED", "The supplied project ID is invalid.");
  }
  return id;
};

const assertExpectedRevision = (expectedRevision) => {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    throw new PersistenceError(
      "VALIDATION_FAILURE",
      "The expected project revision must be a positive integer."
    );
  }
};

const scopeQuery = (query, scope) => {
  if (scope.kind === "anonymous") {
    return query.is("owner_id", null).eq("anonymous_session_id", scope.value);
  }
  if (scope.kind === "workspace") {
    return query.eq("workspace_id", scope.workspaceId);
  }
  return query.eq("owner_id", scope.value).is("anonymous_session_id", null).is("workspace_id", null);
};

const validateSnapshotOrThrow = (snapshot, registries) => {
  const result = validateProjectSnapshot(snapshot, registries);
  if (!result.valid) {
    throw new PersistenceError(
      "VALIDATION_FAILURE",
      "Project snapshot validation failed.",
      { errors: result.errors }
    );
  }
  return result.snapshot;
};

const decodeRow = (row, registries) => {
  try {
    return deserializeProjectRecord(row, registries);
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw new PersistenceError(
        "MALFORMED_RECORD",
        "The persisted project record is malformed or incompatible.",
        { errors: error.details?.errors || [error.message] }
      );
    }
    throw error;
  }
};

const assertRowScope = (row, scope) => {
  const matchesAnonymous =
    scope.kind === "anonymous" &&
    row.anonymous_session_id === scope.value &&
    row.owner_id == null;
  const matchesUser =
    scope.kind === "user" &&
    row.owner_id === scope.value &&
    row.anonymous_session_id == null &&
    row.workspace_id == null;
  const matchesWorkspace =
    scope.kind === "workspace" &&
    row.workspace_id === scope.workspaceId &&
    row.owner_id != null &&
    row.anonymous_session_id == null;

  if (!matchesAnonymous && !matchesUser && !matchesWorkspace) {
    throw new PersistenceError(
      "UNAUTHORIZED",
      "The persisted project is outside the supplied persistence scope."
    );
  }
};

export class ProjectRepository {
  constructor({ client, registries, tableName = "projects" }) {
    if (!client || typeof client.from !== "function") {
      throw new PersistenceError(
        "PERSISTENCE_UNAVAILABLE",
        "A Supabase client is required for the project repository."
      );
    }
    this.client = client;
    this.registries = registries;
    this.tableName = tableName;
  }

  async getWorkspaceRole(scope) {
    const response = await this.client
      .from("workspace_memberships")
      .select("role")
      .eq("workspace_id", scope.workspaceId)
      .eq("user_id", scope.userId)
      .maybeSingle();
    if (response.error) throw mapDatabaseError(response.error, "check workspace membership");
    if (!response.data) throw new PersistenceError("UNAUTHORIZED", "Workspace membership is required.");
    return response.data.role;
  }

  canAccessProject(row, scope, workspaceRole, projectRole, action) {
    const workspaceAdmin = workspaceRole === "owner" || workspaceRole === "admin";
    const creator = row.owner_id === scope.userId;
    const explicitRole = projectRole === "project_admin" || projectRole === "editor" || projectRole === "viewer";
    const canRead = workspaceAdmin || creator || explicitRole || row.visibility === "workspace";
    const canWrite = workspaceAdmin || (
      workspaceRole === "member" &&
      (projectRole === "project_admin" || projectRole === "editor" ||
        (projectRole !== "viewer" && (creator || row.visibility === "workspace")))
    );
    return action === "write" ? canWrite : canRead;
  }

  async getProjectRow({ scope, id }) {
    let query = this.client.from(this.tableName).select(PROJECT_COLUMNS).eq("id", id);
    query = scopeQuery(query, scope);
    const response = await query.maybeSingle();
    if (response.error) throw mapDatabaseError(response.error, "load project permissions");
    if (!response.data) throw new PersistenceError("PERSISTENCE_NOT_FOUND", "Project not found.");
    assertRowScope(response.data, scope);
    return response.data;
  }

  async assertProjectAccess(row, scope, action) {
    const workspaceRole = await this.getWorkspaceRole(scope);
    const membership = await this.client
      .from("project_memberships")
      .select("role")
      .eq("project_id", row.id)
      .eq("user_id", scope.userId)
      .maybeSingle();
    if (membership.error) throw mapDatabaseError(membership.error, "check project membership");
    if (!this.canAccessProject(row, scope, workspaceRole, membership.data?.role, action)) {
      throw new PersistenceError("FORBIDDEN", "You do not have permission to access this project.");
    }
    return { workspaceRole, projectRole: membership.data?.role || null };
  }

  async createProject({ scope, snapshot, visibility = "private" }) {
    const validatedScope = assertScope(scope);
    const normalizedSnapshot = validateSnapshotOrThrow(snapshot, this.registries);
    if (!["private", "workspace"].includes(visibility)) {
      throw new PersistenceError("VALIDATION_FAILURE", "Project visibility must be private or workspace.");
    }
    if (visibility === "workspace" && validatedScope.kind !== "workspace") {
      throw new PersistenceError("FORBIDDEN", "Select a workspace before making a project visible to workspace members.");
    }
    const row = {
      ...serializeProjectSnapshot(normalizedSnapshot, this.registries),
      owner_id: validatedScope.kind === "user" ? validatedScope.value : validatedScope.kind === "workspace" ? validatedScope.userId : null,
      anonymous_session_id:
        validatedScope.kind === "anonymous" ? validatedScope.value : null,
      workspace_id: validatedScope.kind === "workspace" ? validatedScope.workspaceId : null,
      visibility,
    };

    if (validatedScope.kind === "workspace") {
      const membership = await this.client
        .from("workspace_memberships")
        .select("role")
        .eq("workspace_id", validatedScope.workspaceId)
        .eq("user_id", validatedScope.userId)
        .maybeSingle();
      if (membership.error) throw mapDatabaseError(membership.error, "check workspace membership");
      if (!membership.data) throw new PersistenceError("UNAUTHORIZED", "Workspace membership is required.");
      if (membership.data.role === "viewer") throw new PersistenceError("FORBIDDEN", "Viewers cannot create projects.");
    }

    let response;
    try {
      response = await this.client.from(this.tableName).insert(row).select(PROJECT_COLUMNS).single();
    } catch (cause) {
      throw mapDatabaseError(cause, "create");
    }
    if (response?.error) throw mapDatabaseError(response.error, "create");

    try {
      const record = decodeRow(response?.data, this.registries);
      assertRowScope(response.data, validatedScope);
      return record;
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      throw mapDatabaseError(error, "decode created");
    }
  }

  async getProject({ scope, id }) {
    const validatedScope = assertScope(scope);
    const projectId = assertProjectId(id);

    let response;
    try {
      let query = this.client
        .from(this.tableName)
        .select(PROJECT_COLUMNS)
        .eq("id", projectId);
      query = scopeQuery(query, validatedScope);
      response = await query.maybeSingle();
    } catch (cause) {
      throw mapDatabaseError(cause, "load");
    }
    if (response?.error) throw mapDatabaseError(response.error, "load");
    if (!response?.data) {
      throw new PersistenceError("PERSISTENCE_NOT_FOUND", "Project not found.");
    }

    assertRowScope(response.data, validatedScope);
    if (validatedScope.kind === "workspace") await this.assertProjectAccess(response.data, validatedScope, "read");
    return decodeRow(response.data, this.registries);
  }

  async listProjects({ scope }) {
    const validatedScope = assertScope(scope);

    let response;
    try {
      let query = this.client
        .from(this.tableName)
        .select(PROJECT_COLUMNS)
        .order("updated_at", { ascending: false });
      query = scopeQuery(query, validatedScope);
      response = await query;
    } catch (cause) {
      throw mapDatabaseError(cause, "list");
    }
    if (response?.error) throw mapDatabaseError(response.error, "list");

    try {
      const rows = response?.data || [];
      if (validatedScope.kind !== "workspace") {
        return rows.map((row) => {
          assertRowScope(row, validatedScope);
          return decodeRow(row, this.registries);
        });
      }

      const workspaceRole = await this.getWorkspaceRole(validatedScope);
      const memberships = await this.client
        .from("project_memberships")
        .select("project_id, role")
        .eq("user_id", validatedScope.userId);
      if (memberships.error) throw mapDatabaseError(memberships.error, "load project permissions");
      const projectRoles = new Map((memberships.data || []).map((item) => [item.project_id, item.role]));
      return rows.filter((row) => this.canAccessProject(row, validatedScope, workspaceRole, projectRoles.get(row.id), "read"))
        .map((row) => {
          assertRowScope(row, validatedScope);
          return decodeRow(row, this.registries);
        });
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      throw mapDatabaseError(error, "decode project list");
    }
  }

  async updateProject({ scope, id, expectedRevision, snapshot, visibility = undefined }) {
    const validatedScope = assertScope(scope);
    const projectId = assertProjectId(id);
    assertExpectedRevision(expectedRevision);
    const normalizedSnapshot = validateSnapshotOrThrow(snapshot, this.registries);
    if (visibility !== undefined && !["private", "workspace"].includes(visibility)) {
      throw new PersistenceError("VALIDATION_FAILURE", "Project visibility must be private or workspace.");
    }
    if (visibility === "workspace" && validatedScope.kind !== "workspace") {
      throw new PersistenceError("FORBIDDEN", "Select a workspace before making a project visible to workspace members.");
    }

    let current;
    try {
      current = await this.getProject({ scope, id: projectId });
    } catch (error) {
      throw error;
    }
    if (validatedScope.kind === "workspace") {
      const permission = await this.getProjectRow({ scope: validatedScope, id: projectId });
      const roles = await this.assertProjectAccess(permission, validatedScope, "write");
      if (visibility !== undefined && visibility !== permission.visibility &&
          roles.workspaceRole !== "owner" && roles.workspaceRole !== "admin" &&
          !(roles.workspaceRole === "member" && roles.projectRole === "project_admin")) {
        throw new PersistenceError("FORBIDDEN", "Only a Project Admin can change project visibility.");
      }
    }
    if (current.revision !== expectedRevision) {
      throw new PersistenceError(
        "PERSISTENCE_CONFLICT",
        "Project revision is stale; the project was changed elsewhere.",
        { errors: [`Expected revision ${expectedRevision}, found ${current.revision}.`] }
      );
    }

    const patch = serializeProjectSnapshot(normalizedSnapshot, this.registries);
    let response;
    try {
      let query = this.client
        .from(this.tableName)
        .update({ ...patch, ...(visibility === undefined ? {} : { visibility }), revision: expectedRevision + 1 })
        .eq("id", projectId)
        .eq("revision", expectedRevision);
      query = scopeQuery(query, validatedScope);
      response = await query.select(PROJECT_COLUMNS).maybeSingle();
    } catch (cause) {
      throw mapDatabaseError(cause, "update");
    }
    if (response?.error) throw mapDatabaseError(response.error, "update");
    if (!response?.data) {
      throw new PersistenceError(
        "PERSISTENCE_CONFLICT",
        "Project revision changed before the update completed."
      );
    }

    assertRowScope(response.data, validatedScope);
    return decodeRow(response.data, this.registries);
  }

  async deleteProject({ scope, id }) {
    const validatedScope = assertScope(scope);
    const projectId = assertProjectId(id);
    if (validatedScope.kind === "workspace") {
      const permission = await this.getProjectRow({ scope: validatedScope, id: projectId });
      await this.assertProjectAccess(permission, validatedScope, "write");
    }

    let response;
    try {
      let query = this.client
        .from(this.tableName)
        .delete()
        .eq("id", projectId);
      query = scopeQuery(query, validatedScope);
      response = await query.select("id");
    } catch (cause) {
      throw mapDatabaseError(cause, "delete");
    }
    if (response?.error) throw mapDatabaseError(response.error, "delete");
    if (!Array.isArray(response?.data) || response.data.length === 0) {
      throw new PersistenceError("PERSISTENCE_NOT_FOUND", "Project not found.");
    }
    return true;
  }
}

export { PROJECT_COLUMNS, assertScope, assertProjectId };
