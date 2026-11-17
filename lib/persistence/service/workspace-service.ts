import { PersistenceError } from "../project-serialization.js";
import { createSupabaseServerClient } from "../supabase/server";

const mapFailure = (operation: string, cause: unknown): never => {
  if (cause instanceof PersistenceError) throw cause;
  throw new PersistenceError("DATABASE_FAILURE", `Unable to ${operation} workspace.`);
};

export class WorkspaceService {
  private client;

  constructor(client = createSupabaseServerClient()) {
    this.client = client;
  }

  async listWorkspaces({ userId }: { userId: string }) {
    if (!userId) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
    try {
      const memberships = await this.client
        .from("workspace_memberships")
        .select("workspace_id, role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (memberships.error) throw memberships.error;
      const rows = memberships.data || [];
      if (rows.length === 0) return [];

      const workspaceIds = rows.map((membership) => membership.workspace_id);
      const workspaces = await this.client
        .from("workspaces")
        .select("id, name, is_personal, created_by, created_at, updated_at")
        .in("id", workspaceIds)
        .order("created_at", { ascending: true });

      if (workspaces.error) throw workspaces.error;
      const roleByWorkspace = new Map(rows.map((membership) => [membership.workspace_id, membership.role]));
      return (workspaces.data || []).map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        isPersonal: workspace.is_personal,
        createdBy: workspace.created_by,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
        role: roleByWorkspace.get(workspace.id) || "viewer",
      }));
    } catch (cause) {
      return mapFailure("list", cause);
    }
  }

  async getWorkspaceForMember({ userId, workspaceId }: { userId: string; workspaceId: string }) {
    if (!userId) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
    try {
      const membership = await this.client
        .from("workspace_memberships")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .maybeSingle();

      if (membership.error) throw membership.error;
      if (!membership.data) throw new PersistenceError("FORBIDDEN", "Workspace membership is required.");

      const result = await this.client
        .from("workspaces")
        .select("id, name, is_personal, created_by, created_at, updated_at")
        .eq("id", workspaceId)
        .single();

      if (result.error || !result.data) throw result.error || new Error("Workspace not found.");
      return {
        id: result.data.id,
        name: result.data.name,
        isPersonal: result.data.is_personal,
        createdBy: result.data.created_by,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at,
        role: membership.data.role,
      };
    } catch (cause) {
      return mapFailure("load workspace", cause);
    }
  }

  async createWorkspace({ userId, name }: { userId: string; name: string }) {
    if (!userId) throw new PersistenceError("UNAUTHORIZED", "Authentication is required.");
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new PersistenceError("VALIDATION_FAILURE", "Workspace name must contain 2 to 80 characters.");
    }

    try {
      const result = await this.client.rpc("create_workspace_for_user", {
        p_name: normalizedName,
        p_user_id: userId,
      });
      if (result.error) throw result.error;
      const workspaceId = result.data;
      if (typeof workspaceId !== "string") throw new Error("Workspace creation returned no identifier.");

      const workspaces = await this.client
        .from("workspaces")
        .select("id, name, is_personal, created_by, created_at, updated_at")
        .eq("id", workspaceId)
        .single();

      if (workspaces.error || !workspaces.data) throw workspaces.error || new Error("Workspace not found after creation.");
      return {
        id: workspaces.data.id,
        name: workspaces.data.name,
        isPersonal: workspaces.data.is_personal,
        createdBy: workspaces.data.created_by,
        createdAt: workspaces.data.created_at,
        updatedAt: workspaces.data.updated_at,
        role: "owner",
      };
    } catch (cause) {
      return mapFailure("create", cause);
    }
  }
}
