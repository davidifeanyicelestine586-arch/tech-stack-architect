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
