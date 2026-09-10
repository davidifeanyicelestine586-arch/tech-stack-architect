# Phase — CSP & Runtime-Origin Hardening

## Objective

Apply a production Content Security Policy (CSP) based on the application's verified runtime dependencies instead of allowing arbitrary third-party origins.

## Runtime-origin inventory

| Resource | Allowed source | Reason |
|---|---|---|
| Application documents | `'self'` | Next.js application routes and assets |
| JavaScript | `'self'` + inline bootstrap | Next.js App Router runtime requires inline bootstrap scripts |
| Development JavaScript | `'self'` + inline + `unsafe-eval` | Next.js development tooling only; never enabled in production |
| Styles | `'self'` + inline | Tailwind/shadcn runtime styling and Next.js style injection |
| Images | `'self'`, `data:`, `blob:` | Local assets and generated/preview images |
| Fonts | `'self'`, `data:` | Local/bundled font resources |
| API connections | `'self'` + configured Supabase origin | Authentication and project persistence |
| WebSocket connections | configured Supabase `wss:` origin | Future-compatible Supabase realtime transport |
| Frames | `'self'` + configured Supabase origin | Supabase-supported authentication flows if framing is required |

## Implemented policy

- Production `script-src` excludes `unsafe-eval`.
- Supabase connectivity is derived from `NEXT_PUBLIC_SUPABASE_URL` when it is a valid HTTPS `*.supabase.co` origin.
- Invalid or absent Supabase configuration falls back to the constrained `*.supabase.co` origin rather than trusting arbitrary URLs.
- `object-src 'none'` blocks plugin-based content.
- `base-uri 'self'` limits base URL manipulation.
- `form-action 'self'` restricts form submission targets.
- `frame-ancestors 'none'` prevents clickjacking through embedding.
- `upgrade-insecure-requests` protects against accidental HTTP subresource requests.
- Duplicate Next.js configuration was removed so the application has one authoritative runtime header configuration.

## Deliberate constraints

The production policy still permits inline scripts and styles because the current Next.js application has not been migrated to nonce/hash-based rendering. Removing those directives without a nonce strategy could break the application. A future CSP tightening phase should introduce nonces or stable hashes and validate the full App Router runtime before removing the inline allowance.

The policy intentionally does not allow arbitrary third-party script, frame, font, image, or connection origins. New external integrations must be explicitly inventoried and added with a documented reason.

## Verification requirements

- Unit tests must verify production CSP directives and development-only `unsafe-eval`.
- Tests must reject arbitrary Supabase origins.
- Quality Gate must pass before merge.
- Production deployment should be smoke-tested for authentication, project persistence, navigation, and asset loading after release.

## Follow-up controls

- Migrate from inline allowances to nonce/hash-based CSP where practical.
- Add a `Content-Security-Policy-Report-Only` rollout before tightening further.
- Revisit WebSocket/frame directives if Supabase features used by the product change.
- Add staging browser E2E coverage for CSP violations.
