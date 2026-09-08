# Next.js Deployment Guide

This guide covers the production deployment requirements for the Tech Stack Architect Next.js application.

## Runtime requirements

| Requirement | Value |
|---|---|
| Node.js | 22.x |
| Package manager | pnpm 11.23.0 |
| Framework | Next.js 16.x |
| Default port | 3000, unless `PORT` is provided by the host |

Use the repository root as the application directory.

## Production commands

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The production server should be started with the host-provided `PORT` when applicable.

## Development

For local development:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Then open the local development address shown by Next.js.

## Hosting checklist

Before publishing a deployment, confirm that the hosting environment:

- Uses Node.js 22.x.
- Uses the repository root as the application directory.
- Installs dependencies from the committed lockfile.
- Runs `pnpm build` before starting the application.
- Runs `pnpm start` for the production process.
- Provides any required environment configuration through the hosting platform rather than committing credentials to the repository.
- Allows the application to listen on the port supplied by the hosting platform.

## Verification

After deployment, verify that:

1. The live application loads successfully.
2. The main project-analysis workflow is usable.
3. Recommendations can be reviewed and added to a stack.
4. Compatibility validation produces a result.
5. Blueprint generation can be reached from a valid stack.

For repository setup and development commands, see the [main README](../README.md).
