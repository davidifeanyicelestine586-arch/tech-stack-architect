# Tech Stack Architect

Tech Stack Architect is a web application for turning project requirements into a structured, explainable technology-stack proposal. It helps users compare technologies, review recommendation factors, validate a proposed stack, and produce an architecture blueprint.

**Live application:**   https://tech-stack-architect.vercel.app/
**Source repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect

## Contents

- [What it does](#what-it-does)
- [Workflow](#workflow)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Validation](#validation)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## What it does

Tech Stack Architect starts with the project rather than a preferred tool. It captures requirements and constraints, evaluates a structured technology catalog, exposes the reasoning behind recommendations, checks a selected stack for known compatibility issues, and turns the result into a reusable architecture blueprint.

The recommendation and validation engines are **deterministic and registry-based**. They operate on known project metadata, dependencies, conflicts, recipes, and rules rather than calling an external AI service to invent a stack.

## Workflow

```text
Define
  ↓
Analyze
  ↓
Review
  ↓
Build
  ↓
Validate
  ↓
Blueprint
```

1. **Define** — describe the project, domain, requirements, constraints, and preferences.
2. **Analyze** — evaluate the project context against the technology catalog.
3. **Review** — inspect explainable recommendation factors and candidate technologies.
4. **Build** — assemble and refine the selected stack.
5. **Validate** — check dependencies, conflicts, and registered engineering constraints.
6. **Blueprint** — generate a structured architecture result for further implementation or export.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3.3 |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Data / persistence | Supabase |
| Package manager | pnpm 11.23.0 |
| Motion | Motion |
| Icons | Lucide React |
| Charts | Recharts |

Exact dependency declarations are maintained in [`package.json`](package.json) and [`pnpm-lock.yaml`](pnpm-lock.yaml).

## Repository structure

The canonical application is the Next.js implementation:

```text
app/                 Next.js routes and application shell
components/          Product UI and reusable interface components
context/             Application state and workflow provider
data/                Technology, domain, recipe, and project registries
engine/               Deterministic architecture logic
hooks/                Reusable React hooks
lib/                  Persistence, security, configuration, and utilities
tests/                Automated Node.js tests
docs/                 Current guides and engineering records
ui/                   Deprecated legacy compatibility/reference surface
```

The `ui/` directory is **not** the canonical product surface. New features belong in `app/`, `components/`, `context/`, `engine/`, `lib/`, and related canonical directories.

## Requirements

- Node.js 22.x
- pnpm 11.23.0
- Git

These versions match the repository's current package-manager declaration and CI/deployment baseline.

## Local development

Clone the repository and install the committed dependency graph:

```bash
git clone https://github.com/davidifeanyicelestine586-arch/tech-stack-architect.git
cd tech-stack-architect
pnpm install --frozen-lockfile
```

Start the development server:

```bash
pnpm dev
```

Open the local address reported by Next.js, normally:

```text
http://localhost:3000
```

For a production-style local run:

```bash
pnpm build
pnpm start
```

## Configuration

Keep credentials and environment-specific values outside source control.

The application uses Supabase-backed persistence when the required server configuration is available. The deployment environment should provide the required values rather than committing secrets to the repository.

For Vercel, configure the required environment variables in the project settings for the appropriate environments. Do not copy secret values into documentation or issues.

## Validation

Run the repository quality checks locally:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

The GitHub Actions quality gate runs the same core install, lint, TypeScript, test, and production-build checks.

Automated checks do not replace browser-level release verification. Visual, keyboard, assistive-technology, responsive, and production smoke checks should be recorded separately when performed.

## Documentation

The [`docs/`](docs/) directory is organized around two purposes:

- **Current guides** — setup, deployment, architecture, and operational references that describe how the project works now.
- **Engineering records** — QA reports, migration records, security notes, and historical implementation evidence.

Start with [`docs/README.md`](docs/README.md) for the documentation map.

## Deployment

The current deployment target is **Vercel**, with GitHub `main` as the production branch.

The repository is configured as a standard Next.js application:

```text
Framework: Next.js
Root directory: ./
Install command: pnpm install
Build command: pnpm run build
Output directory: Next.js default
Production branch: main
```

See [`docs/vercel-deployment.md`](docs/vercel-deployment.md) for the deployment and environment checklist.

The previous Hostinger deployment work is retained as historical engineering context; Hostinger is no longer the active deployment target.

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making changes.

Keep changes focused, update the relevant documentation when behavior or configuration changes, and avoid committing secrets, generated build output, or unrelated files.

## Support

- **Issues and feature requests:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues
- **Source repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect
- **Live application:** https://architect.ediccrew.com

When reporting an issue, include reproducible steps and relevant error details. Never post passwords, API keys, service-role keys, or other private credentials in public issues.

## License

This project is licensed under the [MIT License](LICENSE).
