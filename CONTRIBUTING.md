# Contributing

Thanks for contributing to Tech Stack Architect.

## Development setup

Requirements:

- Node.js 22.x
- pnpm 11.23.0
- Git

Clone the repository, install the committed dependency graph, and start the development server:

```bash
git clone https://github.com/davidifeanyicelestine586-arch/tech-stack-architect.git
cd tech-stack-architect
pnpm install --frozen-lockfile
pnpm dev
```

The development server runs on `http://localhost:3000` by default.

## Before opening a pull request

Run the repository quality checks:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

These checks mirror the core GitHub Actions quality gate.

## Pull requests

1. Keep changes focused on one problem or feature.
2. Update documentation when behavior, configuration, architecture, or deployment procedures change.
3. Add or update tests for behavior that can be verified automatically.
4. Avoid committing secrets, local environment files, generated build output, or unrelated changes.
5. Use a clear pull request title and describe what changed, why it changed, and how it was verified.
6. Distinguish source-level verification from browser or production verification in the pull request description.

## Architecture boundaries

The canonical product surface is the Next.js application under `app/` with supporting product components, context, hooks, deterministic engine logic, data registries, persistence, security, and tests in their respective canonical directories.

The `ui/` directory is deprecated compatibility/reference material. Do not add new product features or new canonical imports there.

## Documentation

Project documentation is maintained in [`docs/`](docs/).

Start with:

- [`README.md`](README.md) for project orientation.
- [`docs/README.md`](docs/README.md) for the documentation map.
- [`docs/current-project-state.md`](docs/current-project-state.md) for current architecture and deployment boundaries.
- [`docs/vercel-deployment.md`](docs/vercel-deployment.md) for production deployment.

Historical documents should remain clearly identified as historical and should not be used as current operating instructions.

## Deployment workflow

Production follows:

```text
feature branch → pull request → main → Vercel production
```

Use Vercel preview deployments to validate pull-request changes before they reach `main`. Do not treat a successful deployment as a substitute for browser-level product verification.

## Issues and support

Use the repository issue tracker for reproducible bugs, feature requests, and documentation problems:

https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues

For security-sensitive reports, do not publish credentials, private keys, tokens, service-role keys, or other sensitive information in a public issue.

## Code style

Follow the existing TypeScript, React, Next.js, and Tailwind conventions in the repository. Prefer small, readable changes over broad refactors unless the refactor is the subject of the contribution.
