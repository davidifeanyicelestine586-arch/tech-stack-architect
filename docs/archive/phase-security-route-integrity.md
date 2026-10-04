# Phase — Full-Stack Security & Route Integrity

## Objective

Establish explicit server-side authorization boundaries and predictable API security behavior without weakening the anonymous project workflow.

## Implemented

- Supabase bearer-token authentication remains server-side and is used to establish user ownership for project persistence.
- Admin authorization is based only on the explicit `app_metadata.role === "admin"` claim.
- A protected `/api/admin/health` endpoint demonstrates a real server-side administrator boundary without returning user identifiers or sensitive metadata.
- `FORBIDDEN` is represented as a first-class API error and maps to HTTP `403`.
- Browser persistence clients preserve the safe `FORBIDDEN` error code/message.
- Unknown server failures remain generic and do not expose internal error details.
- Existing anonymous sessions continue to use an HttpOnly, SameSite cookie scoped to `/api/projects`.

## Acceptance criteria

- [x] Authentication is validated on the server.
- [x] Authorization is enforced on the server, not only hidden in UI.
- [x] Admin role cannot be granted through arbitrary user metadata.
- [x] Unauthorized and forbidden states are distinguishable.
- [x] Internal failure details are not returned to clients.
- [x] Automated tests cover authorization error boundaries.
- [ ] Full admin feature surface is introduced only when an actual admin capability exists.
- [ ] Production security headers/CSP are audited as a separate deployment-hardening phase.

## Next phase

Deployment and runtime hardening: security headers, CSP strategy, rate limiting, abuse controls, observability, and production configuration validation.
