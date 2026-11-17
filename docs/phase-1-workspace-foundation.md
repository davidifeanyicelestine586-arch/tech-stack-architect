# Phase 1 workspace foundation — implementation notes

This workstream adds the first executable workspace path while preserving the existing anonymous and authenticated project persistence paths.

## Delivered in this slice

- Workspace, workspace membership, invitation, project membership, and workspace activity schema.
- Backfill of existing authenticated project owners into personal workspaces.
- Atomic \`create_workspace_for_user\` RPC, executable only by \`service_role\`.
- Authenticated \`GET /api/workspaces\` and \`POST /api/workspaces\`.
- Authenticated \`POST /api/workspaces/active\`, which verifies membership before setting an HTTP-only, same-site cookie scoped to \`/api/projects\`.
- Workspace management UI at \`/app/workspaces\`, with membership listing, workspace creation, and selection.
- Project repository scoping to the selected workspace.
- Server-side project permission checks:
  - Workspace owner/admin: workspace-wide administration, including private projects.
  - Workspace member: read/write workspace-visible projects.
  - Workspace viewer: read-only workspace-visible projects.
  - Private project: creator, workspace owner/admin, or explicit project membership.
  - Project Admin and Editor may write; Viewer may only read.
- Database trigger that grants the project creator Project Admin membership atomically when a workspace project is inserted.
- Regression coverage for API authentication, active workspace selection, role matrix, repository permission checks, migration function grants, and project creator membership.

## Security boundaries

- Workspace and membership data is queried through the server-side service-role client only.
- Browser roles have no direct table grants on the new workspace tables.
- The active workspace cookie is not an authorization grant. Each project request still checks workspace membership and project permissions in the repository.
- Invalid active-workspace cookies fail closed.
- Private projects are filtered server-side before project records are returned.

## Deliberate remaining work

- Invitation creation, delivery/copy-link flow, acceptance, expiry and revocation.
- Member role changes/removal and required Project Admin reassignment.
- User-facing project visibility selection and explicit project-level sharing UI.
- Workspace activity feed UI and audit events for all membership/visibility mutations.
- Workspace lifecycle operations (rename, ownership transfer, archive/closure).
- Full first-time workspace routing and returning-user last-active workspace persistence.
- End-to-end cross-tenant tests against a Supabase test database and applied-migration verification.

This is an implementation progress note, not a claim that Phase 1 is complete or production-ready.
