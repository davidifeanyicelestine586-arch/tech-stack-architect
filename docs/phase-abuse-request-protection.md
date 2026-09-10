# Phase — Abuse & Request Protection

## Objective

Strengthen the application boundary against accidental overload and common request-abuse patterns without changing the product's persistence contract.

## Implemented controls

- Project API requests are rate-limited at 120 requests per minute per client address.
- `POST`/`PATCH` JSON payloads are bounded to 256 KiB.
- Request bodies are actually read and measured, so chunked requests cannot bypass the size boundary.
- JSON endpoints reject unsupported media types.
- Rate-limit responses use HTTP 429 and `Retry-After`.
- Oversized request responses use HTTP 413.
- Guard failures are emitted as structured JSON security events.
- Server-side Supabase configuration is validated centrally and never exposed through public environment variables.
- Server Supabase clients keep sessions disabled and use only the server-only service-role configuration.

## Deliberate constraints

The rate limiter is an in-process baseline. It is appropriate for a single runtime instance but is not a substitute for distributed edge/platform rate limiting when the application scales across multiple instances. A future production scale phase should move enforcement to the hosting/edge layer or a shared limiter store.

The request-size guard is intentionally conservative at 256 KiB because project snapshots are structured application state rather than file uploads.

## Security logging

Security guard failures are serialized as JSON with timestamps and event names. Token, secret, and authorization-like fields are redacted before emission. Application logs must never contain access tokens, service-role keys, cookies, or raw request bodies.

## Session lifecycle note

The anonymous project cookie remains HttpOnly, scoped to `/api/projects`, uses SameSite=Lax, has a 30-day lifetime, and receives Secure in production. It is an application-scoped anonymous persistence identifier, not an authentication credential.

## Follow-up controls

- Distributed/edge rate limiting for multi-instance production.
- CSRF review if cross-site state-changing flows are introduced.
- Content Security Policy after all runtime origins are inventoried.
- Session/auth lifecycle tests for sign-in, sign-out, refresh, expiry, and account switching.
