# Phase — Session & Authentication Lifecycle Hardening

## Objective

Make authentication lifecycle behavior explicit and testable across initial session hydration, sign-in, sign-up, token refresh, user updates, sign-out, and account switching.

## Implemented controls

- Browser Supabase auth keeps automatic token refresh enabled and persists the session locally.
- Auth UI subscribes to Supabase lifecycle events instead of treating sign-in as a one-time state change.
- `SIGNED_OUT` always clears the rendered user and transient password state.
- `SIGNED_IN`, `INITIAL_SESSION`, `TOKEN_REFRESHED`, `USER_UPDATED`, and `PASSWORD_RECOVERY` reconcile the current session into UI state.
- Unknown auth events are ignored rather than mutating application state.
- Authentication failures are mapped to safe user-facing messages; provider internals and credential details are not surfaced.
- Sign-out failures are handled explicitly instead of being silently discarded.
- Project persistence reads the current browser session access token for each API request, so refreshed or switched sessions do not reuse a stale token.
- Server-side bearer authentication continues to validate the supplied token with Supabase before assigning user ownership.

## Lifecycle contract

`INITIAL_SESSION` establishes the initial UI state. `SIGNED_IN` and `TOKEN_REFRESHED` replace the current session state. `USER_UPDATED` rehydrates the current user from the supplied session. `SIGNED_OUT` is terminal for the current browser session and clears client-visible authentication state.

Account switching is represented by a new `SIGNED_IN` event and therefore replaces the previous user rather than merging identity state.

## Deliberate constraints

This phase does not add a custom server-side session cookie or duplicate Supabase's token lifecycle. The browser Supabase client remains responsible for token persistence and refresh, while the server remains responsible for validating bearer tokens and authorization.

## Follow-up controls

- Add end-to-end browser tests against a staging Supabase project for real sign-in, refresh, expiry, sign-out, and account-switching flows.
- Add explicit password-reset/recovery UI when the product exposes that workflow.
- Review CSRF posture if browser-cookie-based state-changing authentication endpoints are introduced.
- Move rate limiting to the hosting/edge layer when multiple application instances are deployed.
