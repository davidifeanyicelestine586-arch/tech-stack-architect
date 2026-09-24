# Vercel Deployment

This is the current production deployment guide for Tech Stack Architect.

## Deployment model

The intended production path is:

```text
GitHub feature branch
        ↓
Pull request
        ↓
main
        ↓
Vercel production deployment
        ↓
architect.ediccrew.com
```

The repository is a standard Next.js application. Vercel should use its framework-aware Next.js deployment behavior rather than a custom Node server.

## Project settings

Use the following project configuration:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `./` |
| Production branch | `main` |
| Package manager | pnpm |
| Install command | `pnpm install` |
| Build command | `pnpm run build` |
| Output directory | Next.js default |

The repository's `build` script invokes `next build --webpack`. Keep that script as the single source of truth rather than replacing it with a platform-specific build command.

## Environment variables

Configure the required environment variables in Vercel Project Settings. Keep their values out of GitHub and documentation.

Current variable names:

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
```

Use the appropriate Vercel environment scope for each value. In particular, `SUPABASE_SERVICE_ROLE_KEY` is server-side configuration and must never be exposed through a `NEXT_PUBLIC_` variable.

When an environment variable changes, redeploy the affected environment so the new configuration is applied.

## Domain

The intended production domain is:

```text
https://architect.ediccrew.com
```

Configure the domain in the Vercel project and complete the DNS verification Vercel provides. Do not keep two hosting providers competing for the same production hostname.

## Verification checklist

After a production deployment:

1. Confirm the deployment is **Ready** in Vercel.
2. Open the generated Vercel deployment URL.
3. Open `/` and confirm the application shell renders.
4. Exercise the primary workflow:
   - Define
   - Analyze
   - Review
   - Build
   - Validate
   - Blueprint
5. Check project persistence behavior when Supabase is configured.
6. Check API routes used by the application.
7. Verify the custom domain over HTTPS.
8. Check runtime logs if the browser reports a server error.
9. Record any manual browser/device verification in the QA evidence rather than treating the deployment status alone as proof of product correctness.

## Preview and production discipline

Use Vercel preview deployments for pull requests and branch-level verification. Production should track `main`.

Do not use a feature branch as the permanent production source.

## Rollback

If a production deployment introduces a regression:

1. Identify the affected Vercel deployment.
2. Check runtime logs and the Git commit associated with it.
3. Restore the last known-good production deployment through Vercel.
4. Fix the issue on a branch.
5. Verify the fix through a preview deployment.
6. Merge the fix to `main` and promote the resulting production deployment.

## Security notes

- Never commit `.env` or `.env.local` files containing credentials.
- Never place the Supabase service-role key in client-accessible code.
- Keep public and server-only configuration clearly separated.
- Do not paste production environment values into GitHub issues, pull requests, Notion, or screenshots.

## Historical hosting note

The project previously used Hostinger for Next.js deployment. That path is retained in [the historical deployment record](./nextjs-hostinger-deployment.md) because it contains useful compatibility and troubleshooting evidence.

Hostinger is **not** the current production deployment target. Use this Vercel guide for current operations.
