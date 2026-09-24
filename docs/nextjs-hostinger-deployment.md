# Historical: Next.js + Hostinger Deployment

> **Historical record.** Hostinger is no longer the active production deployment target for Tech Stack Architect. Use [Vercel Deployment](./vercel-deployment.md) for current deployment operations.

This document records the repository's previous Hostinger deployment requirements and the compatibility issue that led to the hosting migration.

## Previous runtime baseline

| Requirement | Previous value |
|---|---|
| Node.js | 22.x |
| Package manager | pnpm 11.23.0 |
| Framework | Next.js 16.x |
| Production server | `next start` |
| Default port | 3000 unless supplied by the host |

## Previous production commands

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The repository `build` script uses `next build --webpack`. During the Hostinger migration, this allowed the application to build on the hosting environment where the native SWC binary was incompatible with the host's older glibc version.

## What happened

The repository build completed successfully on Hostinger, including dependency installation, TypeScript checking, static generation, and final build optimization.

The deployed application nevertheless returned an **Internal Server Error** at runtime. Hostinger's runtime log surface remained empty while the failure was reproduced. The deployment configuration exposed the Next.js framework, Node 22.x, pnpm, repository root, build command, and environment variables, but the runtime failure could not be resolved with sufficient evidence.

This distinction matters:

- **Build success** was established.
- **Runtime health on Hostinger** was not established.
- The issue was treated as a hosting/runtime integration problem rather than as proof that the Next.js application itself could not build.

## Migration decision

The project was moved to Vercel so the application could use a deployment platform closely aligned with its Next.js architecture and Git-based deployment workflow.

Current deployment documentation is maintained in:

- [Vercel Deployment](./vercel-deployment.md)
- [Current Project State](./current-project-state.md)

This file remains only as historical engineering context.
