# Tech Stack Architect

Tech Stack Architect is a Next.js application that turns project requirements into a structured, explainable technology stack. It helps users define a project, analyze technical requirements, review scored technology recommendations, validate compatibility, and generate an architecture blueprint.

**Live application:** https://architect.ediccrew.com  
**Source repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect

## Contents

- [Overview](#overview)
- [Core workflow](#core-workflow)
- [Key capabilities](#key-capabilities)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Validation and testing](#validation-and-testing)
- [Project persistence](#project-persistence)
- [Production deployment](#production-deployment)
- [Documentation](#documentation)
- [Current product boundary](#current-product-boundary)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support and contact](#support-and-contact)

## Overview

The application is designed around a requirements-to-architecture workflow rather than a static technology list. A project moves through definition, analysis, recommendation review, validation, and blueprint generation.

The repository also contains a server-side persistence layer for saved project records. Browser code does not connect directly to Supabase; persistence is handled through server-side application boundaries.

## Core workflow

```text
Define project
      ↓
Analyze requirements
      ↓
Review recommendations
      ↓
Validate compatibility
      ↓
Generate architecture blueprint
      ↓
Save / load project records
```

### Typical use case

1. Open the [live application](https://architect.ediccrew.com).
2. Define the project type, requirements, constraints, and expected scale.
3. Review the recommended technologies and their scoring factors.
4. Inspect compatibility validation and the resulting architecture blueprint.
5. Save the project when persistence is configured, then reopen it from the project records flow.

## Key capabilities

### Requirements analysis

Project requirements are converted into structured technical criteria that drive technology recommendations.

### Explainable recommendations

Recommendations expose scoring factors so users can understand why a technology is a fit instead of receiving an unexplained stack list.

### Technology catalog

The catalog provides structured technology metadata used by the recommendation and validation layers.

### Compatibility validation

Selected technologies are checked for known compatibility constraints before the architecture blueprint is produced.

### Architecture blueprint

The final output presents the selected stack and supporting architecture in a structured format suitable for implementation planning.

### Project persistence

Saved projects follow a server-side flow:

```text
UI
 ↓
Next.js API routes
 ↓
Persistence service
 ↓
Supabase
```

The persistence feature supports creating, opening/loading, updating, and deleting project records.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend/data | Next.js server routes, Supabase |
| Package manager | pnpm 11.23.0 |
| Motion | Motion / Framer Motion |
| Icons | Lucide React / Iconify |
| Tables | TanStack React Table |
| Rich text | TipTap |
| Charts | Recharts |

Dependency versions are maintained in [`package.json`](package.json) and the lockfile.

## Requirements

- Node.js 22.x for the supported development/CI environment
- pnpm 11.23.0
- Git

The repository quality workflow uses pnpm 11.23.0 and Node.js 22.

## Installation

Clone the repository and install the exact dependency versions from the lockfile:

```bash
git clone https://github.com/davidifeanyicelestine586-arch/tech-stack-architect.git
cd tech-stack-architect
pnpm install --frozen-lockfile
```

**Source download:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/archive/refs/heads/main.zip

## Configuration

The application uses server-side environment variables for Supabase persistence. The required variables are:

| Variable | Required for | Description |
| --- | --- | --- |
| `SUPABASE_URL` | Persistence | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Persistence | Server-only Supabase service-role key |
| `PORT` | Optional | Port used by the production Node.js server; defaults to `3000` |

Create a local environment file when persistence is enabled. Never commit real credentials.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
```

`SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed through a `NEXT_PUBLIC_*` variable or committed to the repository.

## Usage

Start the development server:

```bash
pnpm dev
```

Then open `http://localhost:3000`.

For a production-style local run:

```bash
pnpm build
pnpm start
```

The default server port is `3000`. Set `PORT` when a different port is required.

## Validation and testing

Run the complete local quality gate:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

The same four checks run in GitHub Actions for pushes to `main` and pull requests.

## Project persistence

Persistence is intentionally separated from browser-side data access. The application uses Next.js API routes and a server-side persistence service before reaching Supabase.

The repository documents the persistence implementation in:

- [`phase-3a2-supabase-repository.md`](docs/phase-3a2-supabase-repository.md)
- [`phase-3a3-persistence-api.md`](docs/phase-3a3-persistence-api.md)
- [`phase-3a4-provider-persistence.md`](docs/phase-3a4-provider-persistence.md)
- [`phase-3a5-project-persistence-ui.md`](docs/phase-3a5-project-persistence-ui.md)

## Production deployment

The current production application is hosted at:

https://architect.ediccrew.com

The deployment documentation covers the Hostinger setup, Node.js runtime, domain configuration, and deployment entrypoint:

- [`nextjs-hostinger-deployment.md`](docs/nextjs-hostinger-deployment.md)
- [`nextjs-deployment-entrypoint-report.md`](docs/nextjs-deployment-entrypoint-report.md)

Keep deployment documentation aligned with the actual hosting configuration when infrastructure changes.

## Documentation

Detailed project records and verification notes are maintained in [`docs/`](docs/):

- Deployment and hosting
- Supabase repository integration
- Persistence API and provider layers
- Project persistence UI
- UX audit and remediation
- Visual verification
- Migration and QA reports

Implementation changes that affect architecture, configuration, deployment, persistence, or user-facing behavior should update the relevant documentation.

## Current product boundary

The current application does **not** include:

- User authentication or accounts
- Login/signup flows
- Teams or collaboration features
- Billing or subscriptions
- Real-time collaboration
- AI/LLM-generated recommendations
- Automatic save/autosave
- Direct browser-to-Supabase access

These boundaries describe the current implementation and should be updated when the product scope changes.

## Contributing

Contribution guidelines are available in [`CONTRIBUTING.md`](CONTRIBUTING.md).

At minimum, contributors should run:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

before opening a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

Tech Stack Architect is built with and benefits from the open-source ecosystem, including:

- Next.js and React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Motion / Framer Motion
- Lucide React and Iconify
- TanStack React Table
- TipTap
- Recharts

See [`package.json`](package.json) for the dependency declarations and versions used by the project.

## Support and contact

- **Issues and feature requests:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues
- **Project repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect
- **Live application:** https://architect.ediccrew.com

Please use the issue tracker for reproducible bugs, feature requests, and documentation problems. Do not post passwords, API keys, service-role keys, or other sensitive information in public issues.
