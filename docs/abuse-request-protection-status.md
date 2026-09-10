# Abuse & Request Protection — Implementation Status

This phase adds application-boundary protections for request abuse and operational safety.

- Rate limiting: 120 requests/minute per client address.
- Request body limit: 256 KiB with both declared-length and streamed-body enforcement.
- JSON content-type enforcement on JSON project operations.
- HTTP 429 + Retry-After for rate-limit responses.
- HTTP 413 for oversized requests.
- Structured security events with credential redaction.
- Central server-only Supabase configuration validation.
- Anonymous persistence cookie remains HttpOnly, SameSite=Lax, path-scoped, 30 days, Secure in production.

The in-process limiter is a baseline, not a distributed production edge limiter.
