import { PersistenceError } from "../project-serialization.js";
import { createSupabaseServerClient } from "../supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const mapFailure = (operation: string, cause: unknown): never => {
  if (cause instanceof PersistenceError) throw cause;
  const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
  if (code === "42501") throw new PersistenceError("FORBIDDEN", "Workspace administrator permission is required.");
  if (code === "P0002") throw new PersistenceError("PERSISTENCE_NOT_FOUND", "The invitation is invalid, expired, or no longer available.");
  if (code === "22023") throw new PersistenceError("VALIDATION_FAILURE", "Invitation details are invalid.");
  if (code === "23505") throw new PersistenceError("PERSISTENCE_CONFLICT", "An invitation already exists for this request.");
  throw new PersistenceError("DATABASE_FAILURE", `Unable to ${operation} workspace.`);
};

export class WorkspaceService {
  private client: SupabaseClient;

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

  async assertProjectAdministrator({ userId, workspaceId, projectId }: {
    userId: string;
    workspaceId: string;
    projectId: string;
  }) {
    const workspace = await this.getWorkspaceForMember({ userId, workspaceId });
    try {
      const project = await this.client
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (project.error) throw project.error;
      if (!project.data) throw new PersistenceError("PERSISTENCE_NOT_FOUND", "Project not found.");
      if (workspace.role === "owner" || workspace.role === "admin") return workspace;
      if (workspace.role !== "member") {
        throw new PersistenceError("FORBIDDEN", "Project administrator permission is required.");
      }
      const membership = await this.client
        .from("project_memberships")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();
      if (membership.error) throw membership.error;
      if (membership.data?.role !== "project_admin") {
        throw new PersistenceError("FORBIDDEN", "Project administrator permission is required.");
      }
      return workspace;
    } catch (cause) {
      return mapFailure("check project administration for", cause);
    }
  }

  async listProjectMembers({ userId, workspaceId, projectId }: {
    userId: string;
    workspaceId: string;
    projectId: string;
  }) {
    await this.assertProjectAdministrator({ userId, workspaceId, projectId });
    try {
      const [projectResult, workspaceResult] = await Promise.all([
        this.client
          .from("project_memberships")
          .select("user_id, role, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
        this.client
          .from("workspace_memberships")
          .select("user_id, role")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true }),
      ]);
      if (projectResult.error) throw projectResult.error;
      if (workspaceResult.error) throw workspaceResult.error;

      const projectRows = projectResult.data || [];
      const workspaceRows = workspaceResult.data || [];
      const accountIds = [...new Set(workspaceRows.map((membership) => membership.user_id))];
      const accounts = await Promise.all(accountIds.map(async (id) => {
        const result = await this.client.auth.admin.getUserById(id);
        return [id, {
          email: result.data?.user?.email || null,
          displayName: result.data?.user?.user_metadata?.full_name || null,
        }] as const;
      }));
      const accountById = new Map(accounts);
      const members = projectRows.map((membership) => ({
        userId: membership.user_id,
        email: accountById.get(membership.user_id)?.email || null,
        displayName: accountById.get(membership.user_id)?.displayName || null,
        role: membership.role,
        assignedAt: membership.created_at,
      }));
      const availableMembers = workspaceRows.map((membership) => ({
        userId: membership.user_id,
        email: accountById.get(membership.user_id)?.email || null,
        displayName: accountById.get(membership.user_id)?.displayName || null,
        workspaceRole: membership.role,
        assigned: projectRows.some((projectMember) => projectMember.user_id === membership.user_id),
      }));
      return { members, availableMembers };
    } catch (cause) {
      return mapFailure("list project members for", cause);
    }
  }

  async grantProjectMember({ userId, workspaceId, projectId, memberId, role }: {
    userId: string;
    workspaceId: string;
    projectId: string;
    memberId: string;
    role: "project_admin" | "editor" | "viewer";
  }) {
    await this.assertProjectAdministrator({ userId, workspaceId, projectId });
    const targetWorkspace = await this.getWorkspaceForMember({ userId: memberId, workspaceId });
    if (targetWorkspace.role === "viewer" && role !== "viewer") {
      throw new PersistenceError("FORBIDDEN", "Workspace viewers cannot receive project write permissions.");
    }
    if (!["project_admin", "editor", "viewer"].includes(role)) {
      throw new PersistenceError("VALIDATION_FAILURE", "Project role is invalid.");
    }
    try {
      const result = await this.client.rpc("grant_project_member", {
        p_project_id: projectId,
        p_user_id: memberId,
        p_role: role,
        p_actor_id: userId,
      });
      if (result.error) throw result.error;
      return { userId: memberId, role: result.data };
    } catch (cause) {
      return mapFailure("grant project access for", cause);
    }
  }

  async removeProjectMember({ userId, workspaceId, projectId, memberId }: {
    userId: string;
    workspaceId: string;
    projectId: string;
    memberId: string;
  }) {
    await this.assertProjectAdministrator({ userId, workspaceId, projectId });
    try {
      const result = await this.client.rpc("remove_project_member", {
        p_project_id: projectId,
        p_user_id: memberId,
        p_actor_id: userId,
      });
      if (result.error) throw result.error;
      return { removed: result.data === true };
    } catch (cause) {
      return mapFailure("remove project access for", cause);
    }
  }

  async listActivity({ userId, workspaceId }: { userId: string; workspaceId: string }) {
    await this.getWorkspaceForMember({ userId, workspaceId });
    try {
      const result = await this.client
        .from("workspace_activity_events")
        .select("id, actor_id, action, subject_type, subject_id, metadata, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (result.error) throw result.error;
      return await Promise.all((result.data || []).map(async (event) => {
        const account = await this.client.auth.admin.getUserById(event.actor_id);
        return {
          id: event.id,
          actorId: event.actor_id,
          actorEmail: account.data?.user?.email || null,
          action: event.action,
          subjectType: event.subject_type,
          subjectId: event.subject_id,
          metadata: event.metadata || {},
          createdAt: event.created_at,
        };
      }));
    } catch (cause) {
      return mapFailure("load workspace activity for", cause);
    }
  }

  async listMembers({ userId, workspaceId }: { userId: string; workspaceId: string }) {
    await this.getWorkspaceForMember({ userId, workspaceId });
    try {
      const result = await this.client
        .from("workspace_memberships")
        .select("user_id, role, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });
      if (result.error) throw result.error;
      return await Promise.all((result.data || []).map(async (membership) => {
        const account = await this.client.auth.admin.getUserById(membership.user_id);
        return {
          userId: membership.user_id,
          email: account.data?.user?.email || null,
          displayName: account.data?.user?.user_metadata?.full_name || null,
          role: membership.role,
          joinedAt: membership.created_at,
        };
      }));
    } catch (cause) {
      return mapFailure("list workspace members for", cause);
    }
  }

  async updateMemberRole({ userId, workspaceId, memberId, role }: {
    userId: string;
    workspaceId: string;
    memberId: string;
    role: "admin" | "member" | "viewer";
  }) {
    const workspace = await this.getWorkspaceForMember({ userId, workspaceId });
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      throw new PersistenceError("FORBIDDEN", "Only workspace owners and admins can change member roles.");
    }
    if (!["admin", "member", "viewer"].includes(role)) {
      throw new PersistenceError("VALIDATION_FAILURE", "Workspace role is invalid.");
    }
    try {
      const result = await this.client.rpc("update_workspace_member_role", {
        p_workspace_id: workspaceId,
        p_member_id: memberId,
        p_new_role: role,
        p_actor_id: userId,
      });
      if (result.error) throw result.error;
      return { userId: memberId, role: result.data };
    } catch (cause) {
      return mapFailure("update workspace member role for", cause);
    }
  }

  async removeMember({ userId, workspaceId, memberId }: {
    userId: string;
    workspaceId: string;
    memberId: string;
  }) {
    const workspace = await this.getWorkspaceForMember({ userId, workspaceId });
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      throw new PersistenceError("FORBIDDEN", "Only workspace owners and admins can remove members.");
    }
    try {
      const result = await this.client.rpc("remove_workspace_member", {
        p_workspace_id: workspaceId,
        p_member_id: memberId,
        p_actor_id: userId,
      });
      if (result.error) throw result.error;
      return { removed: result.data === true };
    } catch (cause) {
      return mapFailure("remove workspace member", cause);
    }
  }

  async listInvitations({ userId, workspaceId }: { userId: string; workspaceId: string }) {
    const workspace = await this.getWorkspaceForMember({ userId, workspaceId });
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      throw new PersistenceError("FORBIDDEN", "Only workspace owners and admins can manage invitations.");
    }
    try {
      const result = await this.client
        .from("workspace_invitations")
        .select("id, email, role, status, expires_at, created_at, accepted_at, revoked_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (result.error) throw result.error;
      const now = Date.now();
      return (result.data || []).map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status === "pending" && new Date(invitation.expires_at).getTime() <= now
          ? "expired"
          : invitation.status,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        acceptedAt: invitation.accepted_at,
        revokedAt: invitation.revoked_at,
      }));
    } catch (cause) {
      return mapFailure("list invitations for", cause);
    }
  }

  async createInvitation({ userId, workspaceId, email, role, tokenHash, expiresAt }: {
    userId: string;
    workspaceId: string;
    email: string;
    role: "admin" | "member" | "viewer";
    tokenHash: string;
    expiresAt: string;
  }) {
    const workspace = await this.getWorkspaceForMember({ userId, workspaceId });
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      throw new PersistenceError("FORBIDDEN", "Only workspace owners and admins can invite members.");
    }
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      throw new PersistenceError("VALIDATION_FAILURE", "A valid invitation email is required.");
    }
    if (!["admin", "member", "viewer"].includes(role)) {
      throw new PersistenceError("VALIDATION_FAILURE", "Invitation role is invalid.");
    }
    try {
      const result = await this.client.rpc("create_workspace_invitation", {
        p_workspace_id: workspaceId,
        p_email: normalizedEmail,
        p_role: role,
        p_token_hash: tokenHash,
        p_invited_by: userId,
        p_expires_at: expiresAt,
      });
      if (result.error) throw result.error;
      const invitationId = result.data;
      if (typeof invitationId !== "string") throw new Error("Invitation creation returned no identifier.");
      return {
        id: invitationId,
        email: normalizedEmail,
        role,
        status: "pending",
        expiresAt,
      };
    } catch (cause) {
      return mapFailure("create invitation for", cause);
    }
  }

  async revokeInvitation({ userId, workspaceId, invitationId }: {
    userId: string;
    workspaceId: string;
    invitationId: string;
  }) {
    const workspace = await this.getWorkspaceForMember({ userId, workspaceId });
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      throw new PersistenceError("FORBIDDEN", "Only workspace owners and admins can revoke invitations.");
    }
    try {
      const result = await this.client.rpc("revoke_workspace_invitation", {
        p_workspace_id: workspaceId,
        p_invitation_id: invitationId,
        p_actor_id: userId,
      });
      if (result.error) throw result.error;
      return { revoked: result.data === true };
    } catch (cause) {
      return mapFailure("revoke invitation for", cause);
    }
  }

  async acceptInvitation({ userId, email, tokenHash }: {
    userId: string;
    email: string;
    tokenHash: string;
  }) {
    if (!userId || !email) throw new PersistenceError("UNAUTHORIZED", "A verified account email is required.");
    try {
      const result = await this.client.rpc("accept_workspace_invitation", {
        p_token_hash: tokenHash,
        p_user_id: userId,
        p_user_email: email,
      });
      if (result.error) throw result.error;
      const accepted = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!accepted?.workspace_id || !accepted?.role) throw new Error("Invitation acceptance returned no workspace.");
      return { workspaceId: accepted.workspace_id, role: accepted.role };
    } catch (cause) {
      return mapFailure("accept invitation for", cause);
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
