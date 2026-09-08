# Tech Stack Architect

Tech Stack Architect is a web application for turning project requirements into a structured technology-stack proposal. It helps users compare technologies, review recommendation factors, validate a proposed stack, and produce an architecture blueprint.

**Live application:** https://architect.ediccrew.com  
**Source repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect

## Contents

- [Overview](#overview)
- [Key capabilities](#key-capabilities)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Validation and testing](#validation-and-testing)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

## Overview

The application follows a requirements-to-architecture workflow:

```text
Project requirements
        ↓
Technology analysis
        ↓
Recommendation review
        ↓
Compatibility validation
        ↓
Architecture blueprint
```

It is intended to make technology selection easier to explain and evaluate rather than presenting a stack as an unexplained list of tools.

## Key capabilities

- **Requirements analysis** — translate project needs and constraints into structured technical criteria.
- **Technology recommendations** — compare candidate technologies using explicit recommendation factors.
- **Compatibility validation** — identify compatibility concerns in a proposed stack before implementation.
- **Architecture blueprinting** — present the resulting stack in a structured architecture-oriented format.
- **Project records** — support saving and reopening project work when the persistence environment is configured.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Data | Supabase |
| Package manager | pnpm 11.23.0 |
| Motion | Motion / Framer Motion |
| Icons | Lucide React / Iconify |
| Tables | TanStack React Table |
| Rich text | TipTap |
| Charts | Recharts |

Exact dependency versions are maintained in [`package.json`](package.json) and `pnpm-lock.yaml`.

## Requirements

- Node.js 22.x
- pnpm 11.23.0
- Git

These versions match the repository's current quality workflow.

## Installation

Clone the repository and install dependencies from the lockfile:

```bash
git clone https://github.com/davidifeanyicelestine586-arch/tech-stack-architect.git
cd tech-stack-architect
pnpm install --frozen-lockfile
```

**Source download:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/archive/refs/heads/main.zip

## Configuration

For local development, create an environment file only if your local setup requires external persistence services.

Keep credentials out of source control and use server-side environment configuration for private service credentials.

The application can also use `PORT` to select a non-default production server port. The default is `3000`.

Refer to the deployment and persistence documentation for environment-specific configuration details.

## Usage

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000` and create a project to explore the requirements, recommendations, validation, and blueprint workflow.

For a production-style local run:

```bash
pnpm build
pnpm start
```

## Validation and testing

Run the complete local quality gate:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

The repository also runs these checks through GitHub Actions on pushes to `main` and pull requests.

## Documentation

The [`docs/`](docs/) directory contains deeper implementation and verification material, including:

- Deployment and hosting notes
- Persistence implementation records
- UX and accessibility review material
- Visual verification notes
- Migration and QA reports

The README is intentionally kept at the public project level. Detailed implementation history belongs in the documentation directory.

## Deployment

The live application is available at:

https://architect.ediccrew.com

Deployment documentation is available in [`docs/nextjs-hostinger-deployment.md`](docs/nextjs-hostinger-deployment.md) and [`docs/nextjs-deployment-entrypoint-report.md`](docs/nextjs-deployment-entrypoint-report.md).

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making changes.

Before opening a pull request, run:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

This project uses and benefits from the open-source ecosystem, including Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Motion, Lucide, Iconify, TanStack Table, TipTap, and Recharts.

See [`package.json`](package.json) for the project's dependency declarations.

## Support

- **Issues and feature requests:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/issues
- **Project repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect
- **Live application:** https://architect.ediccrew.com

When reporting an issue, include reproducible steps and relevant error details. Never post passwords, API keys, or other private credentials in public issues.
