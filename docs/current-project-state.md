# Current Project State

**Project:** Tech Stack Architect  
**Repository:** `davidifeanyicelestine586-arch/tech-stack-architect`  
**Primary branch:** `main`  
**Current main commit checked:** `e5641fe74a8fa302fef2364c998dd0cd816a9b2d`

## Product

Tech Stack Architect turns project requirements into explainable technology-stack proposals and architecture blueprints.

The canonical user journey is:

```text
Define → Analyze → Review → Build → Validate → Blueprint
```

The recommendation and validation logic is deterministic and registry-based.

## Canonical architecture

| Area | Current boundary |
| --- | --- |
| Application | Next.js App Router under `app/` |
| Product UI | `components/` |
| State/workflow | `context/` and `hooks/` |
| Architecture logic | `engine/` |
| Structured catalog | `data/` |
| Persistence/security/utilities | `lib/` |
| Automated tests | `tests/` |
| Legacy surface | `ui/`, deprecated and compatibility/reference only |

The `ui/` directory is not the canonical application surface. New work should not be added there.

## Runtime stack

- Next.js 16.3.3
- React 19.2.5
- TypeScript 6
- Tailwind CSS 4
- shadcn/ui
- Supabase
- pnpm 11.23.0
- Motion
- Lucide React / Iconify
- TanStack React Table
- TipTap
- Recharts

## Deployment

**Current target:** Vercel  
**Production branch:** `main`  
**Production domain:** `https://architect.ediccrew.com`

The previous Hostinger deployment path is historical. See [Vercel Deployment](./vercel-deployment.md) for the active operating instructions.

## Verification boundaries

The repository has automated quality checks for:

- dependency installation
- ESLint
- TypeScript checking
- Node.js tests
- production build

These checks are necessary but not sufficient for full release verification. Browser rendering, responsive behavior, keyboard navigation, screen-reader behavior, reduced-motion behavior, and production smoke testing require explicit runtime evidence.

The project documentation should never claim a manual or production check that has not actually been performed.

## Documentation source of truth

Use:

- [README](../README.md) for product and contributor orientation.
- [Vercel Deployment](./vercel-deployment.md) for current deployment operations.
- [Final QA Evidence](./FINAL_QA_EVIDENCE.md) for verification status.
- [Documentation Guide](./README.md) for the complete documentation map.

Historical records remain valuable, but they should not override these current-state documents.
