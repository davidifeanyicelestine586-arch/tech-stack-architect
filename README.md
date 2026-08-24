# EdicCrew Tech Stack Architect

EdicCrew Tech Stack Architect is a client-side Next.js workspace for assembling, validating, and exporting technology-stack blueprints. The current product uses static JSON registries and a deterministic in-memory engine for component dependencies, conflicts, recipes, and blueprint exports.

## Requirements

Use Node.js 20.9 or newer and **pnpm**. The repository uses `pnpm-lock.yaml` as its canonical lockfile; do not use `npm install` for this project.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The primary application is served by Next.js at `/`. The legacy static UI remains available only through the explicitly named compatibility command:

```bash
pnpm legacy:dev
```

## Verification

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

The test suite exercises the dependency, conflict, validation, recipe, and export engines.

## Production

Use the standard Next.js server after creating a production build:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The application listens on port 3000 by default. Set `PORT` when another port is required.

## Current scope

The current application intentionally does not include authentication, persistence, a database, backend services, external APIs, AI/LLM integrations, or cloud integrations. Those capabilities require a separately approved implementation phase.
