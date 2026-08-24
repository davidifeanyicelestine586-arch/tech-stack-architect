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

## Core product workflow

The workspace now supports the following local, in-memory progression:

```text
Define → Analyze → Recommend → Validate → Blueprint
```

### 1. Define a project

Use **Define Your Project** to enter a project name, description, existing registry domain, difficulty preference, and free-form goals or requirements. A project name and description are required. The definition is held in React state only; this phase does not add persistence, authentication, a database, or a backend.

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

Added recommendations enter the existing selected-stack state. The existing dependency, conflict, pin, and rule validation engine then reports readiness. Blueprint generation preserves the selected technology stack and adds the project definition plus a validation summary to the generated object. Markdown and JSON exports retain their existing APIs; Markdown now includes project-definition and validation-detail sections.

The recommendation layer is **deterministic and registry-based**. It is not an AI/LLM integration and makes no external API calls.

## Phase 2 tests

In addition to the Phase 1 engine tests, `pnpm test` covers project-definition normalization and required fields, domain and difficulty signals, keyword and metadata matching, unknown-concept behavior, registry-only recommendations, explanations, deterministic repeatability, declared-conflict handling, recommendation-to-validation integration, and project-aware Markdown/JSON export output.
