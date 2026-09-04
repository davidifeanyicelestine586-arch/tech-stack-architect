# EdicCrew Tech Stack Architect

EdicCrew Tech Stack Architect is a Next.js workspace for assembling, validating, persisting, and exporting technology-stack blueprints. The product uses structured JSON registries and a deterministic in-memory engine for component dependencies, conflicts, recipes, recommendations, and blueprint exports. Project persistence is implemented behind a server-side API and Supabase repository boundary.

live direct: https://architect.ediccrew.com

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

The test suite exercises the dependency, conflict, validation, recipe, export, project-definition, and persistence layers.

## Production

Use the standard Next.js server after creating a production build:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The application listens on port 3000 by default. Set `PORT` when another port is required.

## Current scope

The current application intentionally does **not** include user authentication, accounts, teams, collaboration, billing, realtime collaboration, or AI/LLM-powered recommendations.

The application **does include project persistence**. Saved projects are handled through the server-side persistence boundary and Supabase. Production persistence requires the deployment environment to provide the required server-side Supabase configuration.

The browser does not connect directly to Supabase and does not receive the service-role key. Persistence uses server-owned project IDs, anonymous HTTP-only session scoping, and revision checks for conflict protection.

## Core product workflow

The workspace supports the following progression:

```text
Define → Analyze → Recommend → Validate → Blueprint
```

Project persistence is a separate supporting workflow:

```text
New → Define → Save → Open/Load → Update/Delete
```

### 1. Define a project

Use **Define Your Project** to enter a project name, description, existing registry domain, difficulty preference, and free-form goals or requirements. A project name and description are required. The definition is normalized before analysis so matching remains deterministic and repeatable.

### 2. Analyze requirements

**Analyze Project** normalizes the entered text into deterministic terms and searches the existing component and recipe metadata. The analyzer considers component names, descriptions, categories, domains, tags, supported project types, outputs, dependencies, and recipe metadata. It never creates technologies that are absent from `data/components.json`.

### 3. Review recommendations

Recommendations are ranked registry components with a transparent score and explanation. Each card shows its category, domain-derived match, difficulty, matching terms, dependencies, recipe relevance when present, declared conflicts, and whether it is safe for the conservative bulk-add action. The user can add one recommendation, add all compatible recommendations, ignore an item, or open the existing component detail modal. Recommendations never replace the current stack automatically.

The current score is intentionally simple:

| Signal | Weight |
|---|---:|
| Selected domain match | 25 |
| Matching normalized metadata terms | Up to 40 |
| Difficulty preference match | 15 |
| Related recipe relevance | Up to 10 |
| Registry dependency compatibility | 5, or -10 when a dependency is unregistered |

Scores are clamped to 0–100. Components with declared direct or reverse registry conflicts are marked incompatible for bulk addition, while the existing validation engine remains the source of truth after selection.

### 4. Validate and generate a blueprint

Added recommendations enter the existing selected-stack state. The dependency, conflict, pin, and rule validation engine then reports readiness. Blueprint generation preserves the selected technology stack and adds the project definition plus a validation summary to the generated object. Markdown and JSON exports retain their existing APIs; Markdown includes project-definition and validation-detail sections.

The recommendation layer is **deterministic and registry-based**. It is not an AI/LLM integration and makes no external recommendation API calls.

## Project persistence

Project persistence is implemented through the following server-side boundary:

```text
Browser UI
  ↓
TechStackProvider
  ↓
Next.js API routes
  ↓
ProjectPersistenceService
  ↓
ProjectRepository
  ↓
Server-side Supabase
```

The persistence API supports:

- Save/Create project
- List projects
- Open/Load project
- Update project
- Delete project
- Revision-based conflict protection

Saved project records contain canonical project information and selected component IDs. Derived recommendations, validation results, blueprints, and other UI state are recomputed after loading rather than treated as authoritative persisted state.

### Production persistence status

The live deployment at `architect.ediccrew.com` was verified on September 4, 2026 with the following production behavior:

- Live project API returned persisted project data.
- Save/Create produced a project visible in the saved-project list.
- Open/Load restored the saved project.
- Update persisted a changed project definition.
- Delete removed a temporary test project from the saved-project list.
- A stale revision was rejected rather than overwriting the newer saved version, and the UI presented the **Saved version changed** / **Reload saved version** conflict state.

Production persistence depends on the deployment environment providing these server-side variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Do not commit these values to the repository. They must remain server-side deployment configuration.

### Current product boundary

Authentication and accounts are not implemented. The current persistence design scopes anonymous projects using a server-managed HTTP-only session cookie. An authenticated account/claim flow remains future work.

## Security and data boundary

The persistence implementation is intentionally server-mediated:

- React components do not access Supabase directly.
- The Supabase service-role key remains server-side.
- Anonymous session identifiers are not returned in response JSON.
- Clients cannot choose their own persistence scope.
- Project access is scoped server-side.
- Revision conflicts are handled explicitly.
- Raw database errors and stack traces are mapped to safe client-facing errors.
- Invalid project IDs and invalid project snapshots are rejected before persistence operations.

## Phase 3A verification

The persistence work was implemented in stages to protect the existing deterministic architecture workflow. The completed production verification covers the persistence contract, Supabase repository, server API, provider integration, persistence UI, deployment configuration, and live CRUD/conflict behavior.

The broader repository verification history also includes type checking, linting, automated tests, production builds, security/dependency guards, and mobile/browser regression checks. Individual verification results should be treated according to the date and scope in the project journal rather than as permanent guarantees for every future commit.

## Technology stack

The project is built around Next.js, React, TypeScript, Tailwind CSS, shadcn UI foundations, Supabase, pnpm, Motion/Framer Motion, Lucide/Iconify, TanStack React Table, TipTap, and Recharts.

## Development notes

Keep `main` authoritative. When implementation changes materially, update this README and the project documentation so that implemented features, verified production behavior, planned work, and limitations remain clearly separated.
