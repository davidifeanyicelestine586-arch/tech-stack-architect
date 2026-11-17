import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceMigration = readFileSync(
  new URL("../supabase/migrations/20261117010000_workspace_api_and_activity.sql", import.meta.url),
  "utf8",
);
const projectMembershipMigration = readFileSync(
  new URL("../supabase/migrations/20261117020000_project_creator_membership_trigger.sql", import.meta.url),
  "utf8",
);
const invitationMigration = readFileSync(
  new URL("../supabase/migrations/20261117030000_workspace_invitation_lifecycle.sql", import.meta.url),
  "utf8",
);
const membershipManagementMigration = readFileSync(
  new URL("../supabase/migrations/20261117040000_workspace_membership_management.sql", import.meta.url),
  "utf8",
);
const rlsMigration = readFileSync(
  new URL("../supabase/migrations/20261117050000_workspace_aware_rls.sql", import.meta.url),
  "utf8",
);
const projectMembershipManagementMigration = readFileSync(
  new URL("../supabase/migrations/20261117060000_project_membership_management.sql", import.meta.url),
  "utf8",
);
const workspaceLifecycleMigration = readFileSync(
  new URL("../supabase/migrations/20261117070000_workspace_lifecycle_and_access_requests.sql", import.meta.url),
  "utf8",
);

test("workspace creation is atomic and records its initial owner", () => {
  assert.match(workspaceMigration, /create or replace function public\.create_workspace_for_user/i);
  assert.match(workspaceMigration, /security definer/i);
  assert.match(workspaceMigration, /set search_path = public, extensions/i);
  assert.match(workspaceMigration, /insert into public\.workspaces/i);
  assert.match(workspaceMigration, /insert into public\.workspace_memberships/i);
  assert.match(workspaceMigration, /'owner'/i);
  assert.match(workspaceMigration, /grant execute on function public\.create_workspace_for_user\(text, uuid\) to service_role/i);
  assert.match(workspaceMigration, /revoke all on function public\.create_workspace_for_user\(text, uuid\) from public, anon, authenticated/i);
});

test("workspace activity is auditable and inaccessible to browser database roles", () => {
  assert.match(workspaceMigration, /create table if not exists public\.workspace_activity_events/i);
  assert.match(workspaceMigration, /workspace\.created/i);
  assert.match(workspaceMigration, /workspace\.member_role_changed/i);
  assert.match(workspaceMigration, /project\.visibility_changed/i);
  assert.match(workspaceMigration, /enable row level security/i);
  assert.match(workspaceMigration, /revoke all on table public\.workspace_activity_events from anon, authenticated/i);
});

test("workspace project creator receives project-admin membership in the insert transaction", () => {
  assert.match(projectMembershipMigration, /create or replace function public\.add_project_creator_membership/i);
  assert.match(projectMembershipMigration, /after insert on public\.projects/i);
  assert.match(projectMembershipMigration, /insert into public\.project_memberships/i);
  assert.match(projectMembershipMigration, /'project_admin'/i);
  assert.match(projectMembershipMigration, /on conflict \(project_id, user_id\) do nothing/i);
});

test("invitation creation, acceptance and revocation are atomic server-only RPCs", () => {
  for (const functionName of ["create_workspace_invitation", "accept_workspace_invitation", "revoke_workspace_invitation"]) {
    assert.match(invitationMigration, new RegExp("create or replace function public\\." + functionName, "i"));
    assert.match(invitationMigration, new RegExp("revoke all on function public\\." + functionName, "i"));
    assert.match(invitationMigration, new RegExp("grant execute on function public\\." + functionName, "i"));
  }
  assert.match(invitationMigration, /token_hash/i);
  assert.match(invitationMigration, /expires_at/i);
  assert.match(invitationMigration, /invitation\.email <> lower\(btrim\(p_user_email\)\)/i);
  assert.match(invitationMigration, /status = 'accepted'/i);
  assert.match(invitationMigration, /status = 'revoked'/i);
  assert.match(invitationMigration, /workspace\.invitation_created/i);
  assert.match(invitationMigration, /workspace\.invitation_revoked/i);
});

test("invitation acceptance preserves stronger existing membership roles", () => {
  assert.match(invitationMigration, /workspace_memberships\.role = 'owner'/i);
  assert.match(invitationMigration, /workspace_memberships\.role = 'admin'/i);
  assert.match(invitationMigration, /workspace_memberships\.role = 'member' and excluded\.role = 'viewer'/i);
});

test("workspace member management protects owners and administrator boundaries", () => {
  assert.match(membershipManagementMigration, /create or replace function public\.update_workspace_member_role/i);
  assert.match(membershipManagementMigration, /create or replace function public\.remove_workspace_member/i);
  assert.match(membershipManagementMigration, /actor_role is null or actor_role not in \('owner', 'admin'\)/i);
  assert.match(membershipManagementMigration, /member_role = 'owner'/i);
  assert.match(membershipManagementMigration, /actor_role = 'admin' and member_role = 'admin'/i);
  assert.match(membershipManagementMigration, /grant execute on function public\.update_workspace_member_role/i);
  assert.match(membershipManagementMigration, /grant execute on function public\.remove_workspace_member/i);
});

test("removing a sole project admin reassigns project administration before revoking membership", () => {
  assert.match(membershipManagementMigration, /not exists \([\s\S]*other_pm\.role = 'project_admin'[\s\S]*\)/i);
  assert.match(membershipManagementMigration, /'project\.admin_reassigned'/i);
  assert.match(membershipManagementMigration, /delete from public\.project_memberships/i);
  assert.match(membershipManagementMigration, /delete from public\.workspace_memberships/i);
  assert.match(membershipManagementMigration, /'workspace\.member_removed'/i);
});

test("workspace RLS replaces legacy owner-only project policies", () => {
  for (const legacyPolicy of [
    "authenticated users can read own projects",
    "authenticated users can create own projects",
    "authenticated users can update own projects",
    "authenticated users can delete own projects",
  ]) {
    assert.match(rlsMigration, new RegExp("drop policy if exists \"" + legacyPolicy + "\" on public\\.projects", "i"));
  }
  assert.match(rlsMigration, /workspace members can read authorised projects/i);
  assert.match(rlsMigration, /current_user_can_access_project/i);
  assert.match(rlsMigration, /p_owner_id = auth\.uid\(\)/i);
  assert.match(rlsMigration, /current_user_has_workspace_role\(p_workspace_id, array\['owner', 'admin'\]\)/i);
});

test("workspace, invitation, project membership and activity RLS are scoped and read-only to browser roles", () => {
  for (const table of ["workspaces", "workspace_memberships", "workspace_invitations", "project_memberships", "workspace_activity_events", "projects"]) {
    assert.match(rlsMigration, new RegExp("alter table public\\." + table + " enable row level security", "i"));
    assert.match(rlsMigration, new RegExp("revoke all on public\\." + table + " from anon, authenticated", "i"));
    assert.match(rlsMigration, new RegExp("grant select on public\\." + table + " to authenticated", "i"));
  }
  assert.match(rlsMigration, /workspace admins can read invitations/i);
  assert.match(rlsMigration, /workspace members can read workspace activity/i);
});

test("project access grants are limited to workspace members and project administrators", () => {
  assert.match(projectMembershipManagementMigration, /create or replace function public\.grant_project_member/i);
  assert.match(projectMembershipManagementMigration, /actor_workspace_role is null/i);
  assert.match(projectMembershipManagementMigration, /actor_project_role = 'project_admin'/i);
  assert.match(projectMembershipManagementMigration, /target user must already belong to the workspace/i);
  assert.match(projectMembershipManagementMigration, /target_workspace_role = 'viewer' and p_role <> 'viewer'/i);
  assert.match(projectMembershipManagementMigration, /grant execute on function public\.grant_project_member/i);
});

test("project membership removal protects the final Project Admin and records activity", () => {
  assert.match(projectMembershipManagementMigration, /create or replace function public\.remove_project_member/i);
  assert.match(projectMembershipManagementMigration, /assign another Project Admin before removing the last one/i);
  assert.match(projectMembershipManagementMigration, /'project\.admin_reassigned'/i);
  assert.match(projectMembershipManagementMigration, /'project\.member_removed'/i);
  assert.match(projectMembershipManagementMigration, /grant execute on function public\.remove_project_member/i);
});

test("workspace lifecycle protects ownership and suspends archived workspaces", () => {
  assert.match(workspaceLifecycleMigration, /add column if not exists status text/i);
  assert.match(workspaceLifecycleMigration, /add column if not exists archived_at timestamptz/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.rename_workspace/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.transfer_workspace_ownership/i);
  assert.match(workspaceLifecycleMigration, /workspace_record\.is_personal/i);
  assert.match(workspaceLifecycleMigration, /workspace_memberships_single_owner_unique_idx/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.archive_workspace/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.restore_workspace/i);
  assert.match(workspaceLifecycleMigration, /status = 'archived'/i);
  assert.match(workspaceLifecycleMigration, /status = 'active'/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.current_user_has_workspace_role/i);
});

test("discoverable workspace access requests are approval-based and role-limited", () => {
  assert.match(workspaceLifecycleMigration, /create table if not exists public\.workspace_access_requests/i);
  assert.match(workspaceLifecycleMigration, /visibility = 'discoverable'/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.request_workspace_access/i);
  assert.match(workspaceLifecycleMigration, /create or replace function public\.review_workspace_access_request/i);
  assert.match(workspaceLifecycleMigration, /p_requested_role not in \('member', 'viewer'\)/i);
  assert.match(workspaceLifecycleMigration, /p_decision not in \('approve', 'reject'\)/i);
  assert.match(workspaceLifecycleMigration, /workspace\.access_request_approved/i);
  assert.match(workspaceLifecycleMigration, /workspace\.access_request_rejected/i);
  assert.match(workspaceLifecycleMigration, /revoke all on public\.workspace_access_requests from anon, authenticated/i);
  assert.match(workspaceLifecycleMigration, /grant select on public\.workspace_access_requests to authenticated/i);
});
