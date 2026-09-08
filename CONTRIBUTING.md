# Contributing

Thanks for contributing to Tech Stack Architect.

## Development setup

Requirements:

- Node.js 22.x (the CI quality gate uses Node 22)
- pnpm 11.23.0
- Git

Clone the repository, install dependencies, and start the development server:

```bash
git clone https://github.com/davidifeanyicelestine586-arch/tech-stack-architect.git
cd tech-stack-architect
pnpm install --frozen-lockfile
pnpm dev
```

The development server runs on `http://localhost:3000` by default.

## Before opening a pull request

Run the same checks used by the repository quality gate:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

Please make sure all checks pass before submitting a pull request.

## Pull requests

1. Keep changes focused on one problem or feature.
2. Update documentation when behavior, configuration, architecture, or deployment procedures change.
3. Add or update tests for behavior that can be verified automatically.
4. Avoid committing secrets, local environment files, generated build output, or unrelated changes.
5. Use a clear pull request title and describe what changed, why it changed, and how it was verified.

## Issues and support

Use the repository issue tracker for reproducible bugs, feature requests, and documentation problems:

https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues

For security-sensitive reports, do not publish credentials, private keys, tokens, or other sensitive information in a public issue.

## Documentation

Project documentation is maintained in [`docs/`](docs/). Keep the relevant document in sync with implementation changes.

## Code style

Follow the existing TypeScript, React, Next.js, and Tailwind conventions in the repository. Prefer small, readable changes over broad refactors unless the refactor is the subject of the contribution.
