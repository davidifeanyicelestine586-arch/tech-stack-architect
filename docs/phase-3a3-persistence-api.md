# Phase 3A.3 — Server Persistence API Boundary

## Status

Phase 3A.3 is complete on the dedicated branch `feature/phase-3a-persistence-api`. The branch was created from the approved Phase 3A.2 branch at commit `e61da94`. It has not been merged into `main`.

This phase adds only the secure Next.js server boundary for the approved persistence service. The browser still does not access Supabase directly, and the existing UI workflow remains unchanged.

## Server Boundary Chosen

Route Handlers were chosen because the current application uses the Next.js App Router and the persistence contract is naturally expressed as explicit HTTP CRUD operations. The boundary is:

```text
Browser/future UI
  ↓ same-origin fetch
Next.js Route Handler
  ↓
ProjectPersistenceService
  ↓
ProjectRepository
  ↓
Server-only Supabase client
```

No Server Actions were added. No second persistence implementation was created.

## Endpoints Created

| Method | Endpoint | Operation |
|---|---|---|
| `POST` | `/api/projects` | Create a project from a validated canonical snapshot. |
| `GET` | `/api/projects` | List only projects in the current anonymous session scope. |
| `GET` | `/api/projects/[id]` | Load one scoped project. |
| `PATCH` | `/api/projects/[id]` | Validate and update a project with an expected revision. |
| `DELETE` | `/api/projects/[id]` | Delete only the scoped project. |

The handlers delegate to the existing `ProjectPersistenceService`; they do not recalculate recommendations, validation reports, recipes, blueprints, or exports.

## Anonymous Session Mechanism

Authentication is not implemented. For anonymous requests, the server reads the `ediccrew_project_session` cookie. If it contains a valid UUID, that value is used to construct the anonymous `PersistenceScope`. If it is absent or invalid, the server generates a new UUID with `randomUUID()` and sets a new cookie.

The session ID is never accepted from the request body or query string. Request-provided session IDs are rejected as unsupported fields, and query-string values are ignored. The session ID is not returned in response JSON.

## Cookie Security Configuration

The anonymous session cookie is configured with:

| Attribute | Configuration |
|---|---|
| Name | `ediccrew_project_session` |
| `HttpOnly` | Enabled |
| `SameSite` | `Lax` |
| `Secure` | Enabled when `NODE_ENV=production`; disabled for local HTTP development |
| `Max-Age` | 2,592,000 seconds / 30 days |
| `Path` | `/api/projects`, covering the project CRUD endpoints only |

The Supabase service-role key is read only by the server-side Supabase factory and is never returned to the browser.

## Request Validation

Every request is validated before the persistence service is called. The API layer rejects malformed JSON, non-object bodies, unsupported fields, missing snapshots, invalid project IDs, invalid expected revisions, and invalid snapshots. Snapshot validation reuses the Phase 3A.1 `validateProjectSnapshot` contract and the existing static registries.

The API does not accept client-controlled scope, owner IDs, timestamps, or revision metadata. The server constructs the anonymous scope from the HTTP-only cookie, while the repository enforces the scope and optimistic revision check.

## Response Design

Success responses use:

```json
{ "ok": true, "data": {} }
```

Error responses use:

```json
{
  "ok": false,
  "error": {
    "code": "PERSISTENCE_CONFLICT",
    "message": "The project changed elsewhere. Reload before saving again."
  }
}
```

Stable persistence codes are preserved. Raw Supabase/database errors, stack traces, service-role credentials, anonymous session IDs, and internal error details are not returned in client responses. Internal causes remain available to server-side logging through the persistence error boundary.

Status mapping includes `400` for validation failures, `401` for invalid authorization scope, `404` for not found, `409` for revision conflicts, and `503` for configuration or database availability failures.

## Security Tests

Twelve API/security tests were added. They prove that:

1. A request cannot supply its own session ID.
2. A query-string session ID is ignored.
3. New sessions receive the expected secure cookie flags.
4. One anonymous session cannot get another session’s project.
5. One anonymous session cannot update another session’s project.
6. One anonymous session cannot delete another session’s project.
7. Invalid project IDs are rejected before service access.
8. Invalid snapshots are rejected before service access.
9. Stale revisions return a conflict response.
10. Raw database errors are mapped to safe responses.
11. Service-role credentials are not exposed.
12. Authentication is not required for anonymous creation.

The repository and Phase 3A.1 contract tests remain in the suite.

## Verification Results

| Check | Result |
|---|---|
| Frozen dependency install | Passed |
| Full test suite | 56 passed, 0 failed |
| API/security tests | 12 passed, 0 failed |
| Type check | Passed |
| Lint | 0 errors; existing non-blocking warnings only |
| Production build | Passed; `/api/projects` and `/api/projects/[id]` compile as dynamic route handlers |
| `git diff --check` | Passed |
| Protected UI/provider scan | No changes to UI components, dashboard shell, `TechStackProvider`, registries, engines, exports, or unrelated routes |
| Credential scan | No real credentials committed |

## Explicit Non-Implementation Confirmation

The following were not implemented:

- User authentication or accounts.
- Login/signup.
- Browser Supabase client.
- Direct database access from React components.
- Persistence UI, Save button, Load button, or auto-save.
- `TechStackProvider` hydration or replacement.
- AI, billing, collaboration, sharing, or realtime.
- Changes to Hostinger, the production domain, or production environment variables.
- Changes to `main` or a merge into `main`.

Required server variables are documented as names only: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. No credentials were added to the repository.

## Commit

- **Branch:** `feature/phase-3a-persistence-api`
- **Base:** `feature/phase-3a-supabase-repository` at `e61da94`
- **Commit:** `448054b` — `feat: add project persistence api`

## Risks and Questions

The API boundary currently uses anonymous session cookies without authentication. Cookie loss creates a new anonymous scope, so previously saved projects are not discoverable from the new cookie. Authentication and an explicit anonymous-to-user claim flow remain future work.

The privileged server client bypasses RLS, so the repository’s explicit scope predicates remain mandatory and are covered by tests. No broad anonymous RLS policy or direct browser database path exists.

Phase 3A.4 should not begin until this branch and API boundary are explicitly approved.
