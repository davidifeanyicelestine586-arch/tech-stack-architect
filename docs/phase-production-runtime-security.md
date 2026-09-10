# Production Runtime Security

## Objective
Establish a conservative production security baseline without breaking the application's existing Next.js, Supabase, authentication, or client-side behavior.

## Implemented in this phase
- Browser security response header policy.
- Regression tests for security-header behavior.

## Baseline policy
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disables camera, microphone, and geolocation by default.

## Deliberately deferred
A strict Content Security Policy should be introduced only after auditing every script, style, image, font, analytics, and third-party origin used by the production deployment. A prematurely strict CSP can break legitimate application behavior.

Rate limiting, request-size limits, production configuration validation, structured security logging, and session lifecycle testing remain subsequent controls.
