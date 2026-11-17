import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20261117000000_add_workspace_foundation.sql", import.meta.url),
  "utf8",
);

test("workspace foundation creates explicit tenant and membership records", () => {
  assert.match(migration, /create table if not exists public\.workspaces/i);
  assert.match(migration, /create table if not exists public\.workspace_memberships/i);
  assert.match(migration, /create table if not exists public\.workspace_invitations/i);
  assert.match(migration, /create table if not exists public\.project_memberships/i);
});

test("workspace roles and invitation lifecycle are constrained by the database", () => {
  for (const role of ["owner", "admin", "member", "viewer", "project_admin", "editor"]) {
    assert.match(migration, new RegExp("'" + role + "'"));
  }
  for (const state of ["pending", "accepted", "expired", "revoked"]) {
    assert.match(migration, new RegExp("'" + state + "'"));
  }
  assert.match(migration, /token_hash/i);
  assert.match(migration, /expires_at/i);
  assert.match(migration, /accepted_at/i);
  assert.match(migration, /revoked_at/i);
});

test("existing authenticated projects are assigned to personal workspaces", () => {
  assert.match(migration, /add column if not exists workspace_id uuid/i);
  assert.match(migration, /add column if not exists visibility text/i);
  assert.match(migration, /insert into public\.workspaces/i);
  assert.match(migration, /insert into public\.workspace_memberships/i);
  assert.match(migration, /update public\.projects/i);
  assert.match(migration, /insert into public\.project_memberships/i);
});

test("legacy project creation remains compatible until workspace selection is wired", () => {
  assert.doesNotMatch(migration, /projects_authenticated_workspace_check/i);
  assert.match(migration, /workspace_id uuid null/i);
});

test("workspace and project tenant tables fail closed under row-level security", () => {
  for (const table of ["workspaces", "workspace_memberships", "workspace_invitations", "project_memberships"]) {
    assert.match(migration, new RegExp("alter table public\\." + table + " enable row level security", "i"));
    assert.match(migration, new RegExp("revoke all on table public\\." + table + " from anon, authenticated", "i"));
  }
});
