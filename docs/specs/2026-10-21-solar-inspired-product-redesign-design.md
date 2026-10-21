# Solar-Inspired Product Redesign — Design Specification

**Date:** 2026-10-21  
**Status:** Proposed for review  
**Repository:** davidifeanyicelestine586-arch/tech-stack-architect

## 1. Objective

Refresh the public website and interactive workspace into a cohesive, production-quality product experience inspired by the uploaded Solar template's visual craft. Use the template as visual reference—not as a replacement application—and preserve Tech Stack Architect's existing product behavior, data model, routes, and deterministic architecture-analysis workflow.

## 2. Product principles

- **Preserve the engine:** do not replace or weaken registry-driven technology discovery, compatibility checks, validation, recommendation logic, or blueprint generation.
- **One product, two modes:** the public site is approachable and premium; the workspace is focused, information-dense, and task-oriented.
- **One design system:** shared color, typography, spacing, radius, elevation, focus, and motion tokens across both modes.
- **Responsive by default:** intentional layouts at narrow mobile, tablet, laptop, and wide desktop widths; no awkward header wrapping or horizontal overflow.
- **Accessible and robust:** semantic structure, keyboard operation, visible focus, reduced-motion support, readable contrast, and resilient loading/empty/error states.
- **No cosmetic-only completion:** changes must be exercised by automated checks and route/component-level tests where practical.

## 3. Visual direction

### Public experience
- Light-first, premium SaaS presentation with clear typography, deliberate whitespace, restrained color, crisp borders, and consistent card geometry.
- A stronger landing-page hierarchy: concise value proposition, clear primary action into the workspace, a product/workflow preview, capability highlights, and a direct explanation of the Define → Analyze → Review → Build → Validate → Blueprint process.
- Improve catalog and discovery pages so technology, domain, and stack information is scannable and the next action is clear.
- Keep informational pages consistent with the public shell and maintain their metadata and structured data.

### Workspace
- Technical/productivity-focused rather than marketing-led.
- Preserve the architecture workflow and make the current stage, inputs, results, validation feedback, and next action easy to understand.
- Keep important actions discoverable and avoid cramped toolbars, competing emphasis, or controls that collide at common viewport sizes.
- Reuse the shared visual language while allowing denser layout and stronger status/validation affordances.

### Theme behavior
- Support existing light/dark theme behavior. Tokens must produce intentional contrast in both modes; avoid isolated hard-coded colors that break theme consistency.

## 4. Scope

### Included
- Global design tokens and base styles in app/globals.css.
- Public shell, header/navigation, footer, and shared visual primitives.
- Landing page at /.
- Technology, domain, and stack discovery routes.
- About, contact, privacy, and terms pages where shared styling applies.
- Workspace shell and workflow surfaces under /app, including responsive actions, forms, dialogs, validation, and result states.
- Accessibility, responsive behavior, metadata preservation, and automated verification.

### Explicitly out of scope
- Replacing the application with the Solar template or importing its app architecture wholesale.
- Rewriting the deterministic recommendation/compatibility engine or changing product rules without evidence and separate approval.
- Removing or renaming existing public routes.
- Adding dependencies solely for visual polish when existing primitives suffice.
- Claiming CI is green without observing the actual checks.

## 5. Implementation sequence

1. **Baseline and inventory**
   - Inspect repository structure, current design tokens, shared components, route implementations, tests, and GitHub Actions.
   - Record the baseline and identify existing behavior that must remain unchanged.
2. **Shared foundation**
   - Define/normalize tokens for surfaces, text, borders, brand/accent, states, spacing, radii, shadows, focus rings, and motion.
   - Improve shared primitives and the public shell/header/footer; verify light/dark and responsive behavior.
3. **Public website**
   - Redesign the landing page and improve discovery/catalog layouts.
   - Bring informational pages into alignment without losing content, metadata, structured data, or navigation.
4. **Workspace**
   - Improve the application shell, stage progression, inputs, validation/result presentation, and action layout.
   - Preserve the existing workflow and all underlying engine behavior.
5. **Quality pass**
   - Test keyboard navigation, focus visibility, reduced motion, contrast, empty/loading/error states, narrow widths, and representative desktop layouts.
   - Add or update tests for material behavior changes and responsive/navigation regressions where the project test setup permits.
6. **Delivery and verification**
   - Review the full diff for regressions and unintended scope.
   - Run the repository's real CI-equivalent commands and inspect GitHub Actions on the branch/PR.
   - Fix failures and repeat verification until required checks pass; report any external blocker explicitly rather than claiming success.

## 6. Verification contract

Inspect the repository scripts and workflow definitions before selecting commands. The expected baseline checks are:

- pnpm lint
- pnpm check
- pnpm test
- pnpm build

Run the applicable commands using the package manager and runtime actually configured by the repository. Also inspect GitHub Actions status for the resulting commit/PR. If a check cannot run because of missing secrets, unavailable infrastructure, or tool limitations, document the exact blocker and do not label the check green.

## 7. Delivery strategy

- Work on an isolated feature branch; do not push design work directly to main.
- Keep commits reviewable and changes scoped to the approved redesign.
- Open a PR with a summary, implementation notes, verification evidence, and any remaining risks.
- Do not merge unless separately requested and the repository's required checks and review policy permit it.

## 8. Acceptance criteria

- Existing routes and core product workflow remain functional.
- The public experience has a coherent visual hierarchy and consistent shared shell.
- Workspace actions and stages remain clear and usable at mobile and desktop sizes.
- Light and dark themes remain readable and intentional.
- No new header/toolbar collisions or unintended horizontal overflow at representative viewport widths.
- Accessibility basics and interaction states are covered by inspection/tests.
- Lint, type checking, tests, build, and applicable GitHub CI checks pass—or any externally blocked check is explicitly documented.
- Final report links to the branch/PR and states exactly which checks were observed passing.
