# Phase — CSRF & Same-Origin Request Hardening

## Objective

Protect cookie-backed project mutations from cross-site request forgery while preserving compatibility with non-browser clients that do not send an `Origin` header.

## Implemented controls

- State-changing project requests (`POST`, `PUT`, `PATCH`, `DELETE`) are checked for an `Origin` header before persistence work begins.
- When `Origin` is present, it must exactly match the origin derived from the request URL.
- Cross-origin or malformed origins fail with `403` and the stable `CSRF_ORIGIN_MISMATCH` error code.
- CSRF failures retain the existing opaque `X-Request-ID` correlation header and structured server-side logging.
- Existing `HttpOnly; SameSite=Lax` anonymous project cookies remain in place as a defense-in-depth browser control.
- Requests without `Origin` remain supported for server-to-server and non-browser clients; this is intentionally not treated as proof of trust.

## Security contract

The application does not accept a caller-supplied origin allowlist. The expected origin is derived from the actual request URL, avoiding a request-controlled header becoming an authorization decision.

This control is complementary to authentication and authorization. It does not replace Supabase token verification or project ownership enforcement.

## Follow-ups

- Add an explicit trusted-origin policy if the product intentionally supports multiple first-party origins.
- Add browser-level staging tests covering credentialed cross-origin requests.
- Revisit origin handling if deployment introduces a proxy topology where the canonical external origin differs from the application request URL.
- Continue with distributed/edge rate limiting for multi-instance production.
