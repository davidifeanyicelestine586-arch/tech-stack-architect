# Phase 1 workspace foundation — implementation notes

This workstream adds the workspace and collaboration foundation while preserving the existing anonymous and authenticated project persistence paths.

## Delivered in this slice

- Workspace, workspace membership, invitation, project membership, and workspace activity schema.
- Backfill of every existing authenticated account into a private personal workspace, plus an auth-user trigger that provisions one for every new signup.
- Atomic `create_workspace_for_user` RPC, executable only by `service_role`.
- Authenticated workspace listing, creation, and active-workspace selection.
- Workspace management UI at `/app/workspaces`, with creation, selection, member listing, role changes, removal, recent activity, rename, discoverability, ownership transfer, archive, and restore.
- Invitation creation, listing, revocation, and acceptance APIs.
- One-time invitation tokens are generated server-side, SHA-256 hashed before storage, returned once as copyable links, and accepted only by a signed-in account with the matching verified email.
- Workspace member removal revokes project memberships and reassigns sole Project Admin assignments before removing the member.
- One-owner-per-workspace database invariant and protected ownership transfer; the former owner becomes an Admin.
- Discoverable workspaces with access-request creation, requester status tracking, and owner/admin approval or rejection. Requests require a verified account email and can only grant Member or Viewer roles.
- Workspace ownership transfer, protected owner roles, archive and restore lifecycle, and active-workspace suspension while archived.
- Project repository scoping to the selected workspace.
- Private/workspace project visibility selection and persistence.
- Project access UI to grant Project Admin, Editor, and Viewer roles to existing workspace members.
- Server-side project permission checks:
  - Workspace owner/admin: workspace-wide administration, including private projects.
  - Workspace member: workspace-visible projects by default; private projects only with explicit project membership.
  - Workspace viewer: read-only access, even if a project grant would otherwise permit writing.
  - Project Admin: administers only the assigned project; this does not grant workspace administration.
  - Editor: may edit assigned projects; Viewer: read-only.
  - Workspace membership caps project permissions; project grants cannot bypass workspace membership or a workspace Viewer restriction.
- Database trigger that grants the project creator Project Admin membership atomically when a workspace project is inserted.
- Workspace-aware RLS policies for projects, workspaces, memberships, invitations, project memberships, and activity events. Browser database roles have read-only grants and no direct mutation grants.
- Last-active workspace cookie and per-workspace last-active project restoration, with server-side authorization rechecked on restoration. When a signed-in user has exactly one active workspace, the app automatically selects it on workspace bootstrap.
- Activity events for workspace creation, invitation lifecycle, member changes, ownership transfer, archive/restore, access-request review, Project Admin reassignment, project membership changes, and project visibility changes.
- Regression coverage for API authentication, active workspace selection, role matrix, project repository authorization, invitation workflows, member management, migration contracts, and RLS grants.

## Security boundaries

- Workspace and membership mutations use server-side service-role functions only.
- Browser roles cannot directly insert, update, or delete workspace/project collaboration records.
- Active workspace and active project cookies are selectors, not authorization grants. Each project request still checks workspace membership and project permissions.
- Workspace-owned projects are not accessible through the legacy user-owned project scope.
- Removing a workspace member removes their project memberships; the database reassigns sole Project Admin assignments before revocation.
- Private projects are filtered server-side and through workspace-aware RLS policies.
- Invitation links contain a one-time raw token only in the returned URL; the database stores only its SHA-256 hash.

## Deliberate remaining work

- Email delivery provider integration (current invitation links are copied and sent manually).
- Discoverable workspaces and access-request approval flows.
- Workspace rename, ownership transfer/succession, and archive/closure lifecycle.
- Background expiry-state materialization for pending invitations (expired invitations are treated as expired at read/accept time).
- Automatic routing when a returning user has multiple active workspaces but no valid last-active selection; the workspace manager remains the explicit chooser.
- Cross-tenant integration tests against a running Supabase test database, including applying every migration and verifying real RLS behavior.
- A durable transactional audit path for project visibility changes (the current repository records these events best-effort after the project update).

This is an implementation progress note, not a claim that Phase 1 is complete or production-ready.
