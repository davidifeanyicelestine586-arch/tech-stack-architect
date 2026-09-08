# EdicCrew Tech Stack Architect

EdicCrew Tech Stack Architect is a Next.js workspace for turning project requirements into a structured, explainable technology stack. It helps a developer define a project, analyze it against a registered technology catalog, review recommendations, build a candidate stack, check compatibility, match optional stack templates, and generate an exportable architecture blueprint.

**Live application:** https://architect.ediccrew.com  
**Repository:** https://github.com/davidifeanyicelestine586-arch/tech-stack-architect

## Product workflow

```text
Define → Analyze → Review Recommendations → Build → Validate → Blueprint
```

The workspace also supports a separate persistence workflow:

```text
New → Define → Save → Open/Load → Update/Delete
```

## What the application does

### 1. Define a project

The guided project form captures the context needed for analysis:

- Project name and description
- Project type
- Goals and requirements
- Complexity preference

The primary action is **Analyze My Project**. Required fields are validated before analysis.

### 2. Analyze requirements

The analyzer normalizes project text and matches it against registered component and recipe metadata. Matching considers names, descriptions, categories, domains, tags, supported project types, outputs, dependencies, and recipe metadata.

The recommendation engine is **deterministic and registry-based**. It does not call an external AI/LLM recommendation service or invent technologies that are absent from the registry.

### 3. Review recommendations

Recommendations are ranked and explainable. Each recommendation can expose its fit, matching signals, dependencies, conflicts, difficulty, recipe relevance, and the reason it was recommended.

Users can:

- Add one technology to the stack
- Inspect details
- Dismiss a recommendation
- Add compatible recommendations in bulk
- Review why a technology was recommended

The current stack is never silently replaced by recommendations.

### Recommendation scoring

| Signal | Weight |
|---|---:|
| Selected domain match | 25 |
| Matching normalized metadata terms | Up to 40 |
| Difficulty preference match | 15 |
| Related recipe relevance | Up to 10 |
| Registry dependency compatibility | 5, or -10 when a dependency is unregistered |

Scores are clamped to 0–100. Registry conflicts can prevent conservative bulk addition, while the validation engine remains the final source of truth after selection.

## Technology catalog

The application uses structured registries for components, domains, and stack templates. A component can describe relationships and constraints such as:

- Domain and category
- Description and tags
- Required dependencies
- Optional technologies
- Declared conflicts and warnings
- Difficulty and estimated learning effort
- Supported project types
- Outputs
- Hardware pins where relevant

This lets the same architecture model represent software/web, AI/automation, and mechatronics-oriented components.

## Compatibility validation

The **Compatibility Check** evaluates the technologies actually selected by the user. It is intentionally separate from recommendation fit.

The validation engine can report:

- Missing dependencies
- Component conflicts
- Hardware pin conflicts where represented in the registry
- Rule violations
- Warnings and other registered compatibility conditions

A successful result communicates that the selected technologies work together and points the user toward blueprint generation.

## Stack templates

Stack templates are an **optional shortcut**, not a required step. They represent curated combinations that can help users start from a proven pattern and then adjust the stack to their project.

## Architecture blueprint

After the stack is validated, the application can generate a structured architecture blueprint containing the project definition, selected technologies, and validation summary.

Supported exports include:

- Markdown blueprint
- JSON representation/schema
- Copy-to-clipboard actions
- Downloadable `.md` and `.json` artifacts

## Project persistence

Project persistence is implemented behind a server-side boundary:

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
- New/reset local work
- Revision-based conflict protection

Saved records contain canonical project information and selected component IDs. Derived recommendations, validation results, blueprints, and other UI state are recomputed after loading rather than treated as authoritative persisted state.

### Security boundary

- React components do not connect directly to Supabase.
- The Supabase service-role key remains server-side.
- Anonymous project scope is controlled by a server-managed HTTP-only session.
- Clients cannot choose their persistence scope.
- Revision conflicts are handled explicitly.
- Invalid project IDs and snapshots are rejected before persistence operations.
- Raw database errors and stack traces are mapped to safe client-facing errors.

Authentication/accounts, teams, collaboration, billing, realtime collaboration, and anonymous-to-user account claiming are outside the current product boundary.

## UX redesign and human-factors work

A dedicated UX audit was used to reduce cognitive load without removing the application's underlying architecture capabilities.

The redesign addressed:

- **Hick's Law:** moved the workspace toward a guided six-step journey instead of exposing every decision at once.
- **Miller's Law:** reduced simultaneous visible concepts and used progressive disclosure for secondary details.
- **Tesler's Law:** translated technical labels such as Nodes and Engineering Tracks into clearer user-facing language such as Technologies and Project Type where appropriate.
- **Fitts's Law:** increased important controls and action targets toward touch-friendly 44–48px sizing.
- **Doherty Threshold:** added clearer action/state feedback where workflow state is important.
- **Peak-End Rule:** made successful validation and blueprint generation explicit end-state moments.
- **Jakob's Law:** retained familiar search, cards, selectors, disclosures, and action patterns while reducing unexplained jargon.

The result keeps the underlying technical depth available while making the primary journey easier to understand and operate.

## Responsive and mobile behavior

The production workflow was checked on mobile, including a 390×844 viewport. The guided journey, project form, recommendations, selected stack, validation, and blueprint areas remain usable without visible project-control overflow. Important actions use touch-friendly targets and the selected stack is presented as part of the mobile flow rather than competing with the main workspace.

## Production deployment

The application is deployed as a Next.js application on Hostinger and is published at `architect.ediccrew.com`.

The custom subdomain uses an A record pointing to the Hostinger website IP. The deployment uses the `main` branch with Node.js 22.x in the Hostinger environment.

The production deployment was manually verified through the live application after the DNS configuration was corrected. The live workflow was exercised from project definition through recommendation, stack selection, compatibility checking, stack-template/blueprint areas, and project persistence controls.

## Verification status

The current production state has been functionally verified by interactive browser/mobile QA. Confirmed flows include:

- Landing page and guided workflow navigation
- Required project-field validation
- Project definition submission
- Deterministic recommendation rendering
- Adding a recommended technology to the stack
- Selected-stack updates
- Compatibility feedback and missing dependency handling
- Stack template area
- Blueprint generation/export flow
- New/Open/Save project controls
- Mobile interaction and readable responsive layout
- Final UX hierarchy and touch-target improvements

The latest UX clarity correction is recorded in commit `afff2666dd93d83bbd3d7c1266e5f8de8f509ab6`, which changed the initial hero compatibility metric from a misleading **Ready** state to **Not checked yet** until validation has actually occurred.

Automated repository verification also includes linting, type checking, tests, production builds, dependency/security guards, and regression checks. Individual historical results should be interpreted according to their recorded date and commit.

## Requirements

Use Node.js 20.9 or newer and **pnpm**. The repository uses `pnpm-lock.yaml` as its canonical lockfile; do not use `npm install` for this project.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Verification commands

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

The test suite covers dependency, conflict, validation, recipe, export, project-definition, and persistence behavior.

## Production server

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The application listens on port 3000 by default. Set `PORT` when another port is required.

## Current product boundary

The current application intentionally does **not** include:

- User authentication and accounts
- Login/signup
- Team accounts
- Collaboration/comments/sharing
- Billing
- Realtime collaboration
- AI/LLM-powered recommendations
- Automatic save/autosave
- Direct browser-to-Supabase access

These are product boundaries, not undocumented gaps.

## Technology stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui foundations
- Supabase
- pnpm
- Motion / Framer Motion
- Lucide React / Iconify
- TanStack React Table
- TipTap
- Recharts

## Documentation

Project documentation is maintained in `docs/`, including deployment notes, persistence implementation records, migration reports, and visual/UX verification records.

When implementation changes materially, update the README and relevant project documentation so that implemented features, verified production behavior, planned work, and limitations remain clearly separated.
