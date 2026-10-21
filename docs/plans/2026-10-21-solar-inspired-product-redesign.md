# Solar-Inspired Product Redesign Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a cohesive, accessible, responsive redesign of Tech Stack Architect's public site and interactive workspace while preserving existing product behavior and keeping CI green.

**Architecture:** Keep the canonical Next.js application and its existing registry-driven engine. Establish the visual foundation in the global CSS tokens and shared public shell, then redesign the landing/discovery surfaces and workspace in separate reviewable increments. Use existing Tailwind, shadcn primitives, Lucide icons, and current dependencies unless repository evidence demonstrates a necessary gap.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Tailwind CSS v4, shadcn/ui, pnpm 11, Node.js test runner, ESLint, Playwright (already declared).

## Global Constraints

- Use the Solar template as visual inspiration, not as a replacement application.
- Preserve registry-driven technology discovery, compatibility checks, validation, recommendation logic, and blueprint generation.
- Keep existing routes and metadata/structured data.
- Use one shared design system across public and workspace experiences while keeping the public experience premium/light-first and the workspace technical/productivity-focused.
- Support existing light/dark theme behavior with readable contrast in both modes.
- Design responsively for mobile, tablet, laptop, and wide desktop; prevent header collisions and unintended horizontal overflow.
- Preserve semantic structure, keyboard operation, visible focus, reduced-motion support, readable contrast, and robust loading/empty/error states.
- Avoid adding dependencies solely for visual polish.
- Work on this isolated feature branch; do not push directly to main or merge without a separate request.
- Do not claim a check is green unless its result has been observed. Report infrastructure/secrets/tool blockers explicitly.
- Acceptance checks: existing routes/workflow functional; public shell and visual hierarchy coherent; workspace actions clear at mobile/desktop; light/dark intentional; no header collisions or unintended overflow; accessibility and interactions checked; lint, typecheck, tests, build, and applicable CI pass.

---

### Task 1: Establish and verify the shared visual foundation

**Files:**
- Modify: `app/globals.css` (observed)
- Modify: `components/public/public-shell.tsx` (observed)
- Modify: `components/layout/footer.tsx` (observed)
- Test: existing Node tests under `tests/` (directory observed; exact test filenames to be discovered before edits)
- Proposed: add focused CSS/source assertions to the existing test convention only if it supports meaningful, stable coverage.

**Interfaces:**
- Consumes: CSS custom properties already exposed by `app/globals.css`; `PublicShell({ children }: { children: ReactNode })`; shared `Footer()`.
- Produces: consistent semantic tokens and a public shell with a stable single-product identity, accessible navigation, skip link, and footer links.

- [ ] **Step 1: Capture baseline and locate conventions**
  
  Inspect current route tree, test files, GitHub Actions, theme provider, and package-manager lockfile. Record current checks before visual changes. Confirm all existing shared shell links map to valid routes; specifically verify the current Documentation link to `/content-detail`.

- [ ] **Step 2: Add focused regression coverage**
  
  Add tests using the repository's existing Node test conventions for any pure exported design/navigation helpers introduced. Prefer source/route smoke tests only where already established; do not create brittle tests that assert arbitrary CSS class ordering. Record a failing test for any newly extracted helper before implementing it.

- [ ] **Step 3: Implement shared tokens and shell**
  
  Normalize brand/accent, surface, muted text, border, success/warning/error, focus, spacing, radii, and elevation tokens using CSS custom properties. Keep tokens compatible with the existing Tailwind v4 and dark-mode configuration. Improve public header layout so the wordmark and nav remain intentional across narrow widths; preserve minimum interactive target heights and keyboard focus. Make footer groups align and wrap cleanly. Honor `prefers-reduced-motion` and existing theme selection.

- [ ] **Step 4: Verify the focused behavior**
  
  Run the focused tests added/updated in this task. Expected: all tests pass; no public navigation route has been removed; shell remains semantic and keyboard navigable.

- [ ] **Step 5: Run integration checks**
  
  Run `pnpm lint` and `pnpm check`. Expected: both exit 0. If baseline failures exist, separate pre-existing failures from regressions and fix regressions before proceeding.

- [ ] **Step 6: Commit the passing deliverable**
  
  Commit only shared foundation and its focused tests with message `style: establish shared product design foundation`.

### Task 2: Redesign the public landing and discovery experience

**Files:**
- Modify: `app/page.tsx` (observed)
- Modify: route files for `/technologies`, `/domains`, `/stacks`, and their detail pages (discover exact paths during inventory; route paths are confirmed in README)
- Modify only where needed: public informational route files under `app/` (observed route family in README)
- Test: relevant existing tests under `tests/`; add focused tests for any new pure view-model/helper logic.

**Interfaces:**
- Consumes: `PublicShell`, `JsonLd`, `getAllComponents()`, `getAllDomains()`, `getAllRecipes()`, `absoluteUrl`, `SITE_DESCRIPTION`, `SITE_NAME`.
- Produces: public landing/catalog layouts that keep current URLs, registry data, metadata, structured data, and clear paths into `/app`.

- [ ] **Step 1: Define public-page regression checks**
  
  Verify landing metadata/canonical and JSON-LD remain present; verify the page still reads counts and cards from the registry functions, not hard-coded sample data. Add assertions for any extracted pure presentation helper if one is introduced.

- [ ] **Step 2: Implement landing page hierarchy**
  
  Create a strong hero with a concise product value proposition and primary `/app#define` action, a secondary catalog action, a visually clear workflow/product preview, capability highlights, domain/recipe discovery, and a closing workspace CTA. Use responsive grid/flex primitives and existing icon/dependency set. Retain the six workflow stages and accurate deterministic-engine explanation.

- [ ] **Step 3: Improve catalog and detail layouts**
  
  Inspect exact route files before editing. Improve hierarchy, scannability, spacing, card states, and next-step links for technology, domain, and stack pages without changing registry IDs, URLs, data shape, filtering semantics, or content meaning. Align About, Contact, Privacy, and Terms with the shared shell without removing policy content.

- [ ] **Step 4: Verify public routes**
  
  Run focused tests and use a production/development browser smoke test if the available environment supports it. Expected: all public routes render, internal links resolve, catalog content remains data-driven, and metadata/structured data remains intact.

- [ ] **Step 5: Run integration checks**
  
  Run `pnpm lint`, `pnpm check`, and `pnpm test`. Expected: exit 0 and no missing route imports or hydration/type errors.

- [ ] **Step 6: Commit the passing deliverable**
  
  Commit public pages and their tests with message `style: refresh public product experience`.

### Task 3: Improve workspace layout and workflow clarity

**Files:**
- Inspect and modify the canonical workspace route and its current shell/components under `app/`, `components/`, and `context/` (exact files to be confirmed from the repository tree before edits).
- Modify shared CSS tokens only where workspace-specific needs cannot be represented by existing tokens.
- Test: relevant engine/workflow tests under `tests/`; preserve existing tests unchanged unless a UI behavior change requires a focused update.

**Interfaces:**
- Consumes: existing workflow context/provider, registry and engine APIs, route structure, validation/result types, existing theme provider.
- Produces: responsive workspace chrome, clearer stage progression, action placement, and readable input/validation/result states without changing engine semantics.

- [ ] **Step 1: Map the current workflow and test behavior**
  
  Identify the current state provider, Define/Analyze/Review/Build/Validate/Blueprint components, persistence boundaries, and existing tests. Record key user-visible behavior and current route/query/hash handling before layout changes.

- [ ] **Step 2: Add targeted regression checks**
  
  Add or update tests only for observable behavior at risk: stage order/prerequisite gating, key action visibility, validation result states, and navigation/hash handling. Do not duplicate existing engine tests or mock away the deterministic rules.

- [ ] **Step 3: Implement workspace hierarchy**
  
  Refine the workspace header/toolbar so actions do not collide at mobile widths; keep primary actions prominent and secondary actions grouped. Clarify current stage, stage prerequisites, inputs, result summaries, validation feedback, and the next available action. Ensure long technology names, empty results, validation warnings, and narrow viewports remain usable. Preserve existing state, persistence, engine, and export behavior.

- [ ] **Step 4: Verify focused interactions**
  
  Run focused tests and browser smoke checks where supported. Expected: workflow order and gating remain correct; inputs and actions are keyboard operable; empty/error/success states remain distinguishable; no horizontal overflow at representative mobile and desktop widths.

- [ ] **Step 5: Run integration checks**
  
  Run `pnpm lint`, `pnpm check`, and `pnpm test`. Expected: exit 0 with all existing engine regression tests passing.

- [ ] **Step 6: Commit the passing deliverable**
  
  Commit workspace changes and focused tests with message `style: clarify architecture workspace workflow`.

### Task 4: Full quality, responsive, and CI release gate

**Files:**
- Modify only files implicated by verified regressions.
- Update: `docs/` quality/design notes only when useful to document actual final behavior.
- Review: all changed files and the PR diff.

**Interfaces:**
- Consumes: all prior deliverables and package scripts in `package.json`.
- Produces: a reviewable pull request with explicit verification evidence and no unaddressed regressions introduced by the redesign.

- [ ] **Step 1: Run full repository checks**
  
  Run `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` using the committed pnpm version and Node.js 22.x baseline. Expected: each exits 0.

- [ ] **Step 2: Verify responsive/accessibility behavior**
  
  Use the repository's Playwright setup if usable. Inspect widths 390×844 and 1280×900 plus tablet and wide desktop. Verify public and workspace headers, no unintended horizontal scrolling, keyboard-only navigation, visible focus, labels/names for controls, meaningful heading structure, dark/light theme contrast, and reduced-motion behavior. Record any check that cannot be performed in the available environment.

- [ ] **Step 3: Review regression surface**
  
  Review the full diff, route list, metadata/JSON-LD, console errors, external links, workflow state handling, and engine tests. Confirm no Solar template app code, unrelated dependency changes, or secrets were introduced.

- [ ] **Step 4: Commit fixes and create PR**
  
  Commit only verified fixes with specific messages. Open a PR from `design/solar-inspired-product-redesign` to `main` describing the visual changes, preserved behavior, test commands/results, screenshots if available, and remaining limitations. Do not merge without a separate request.

- [ ] **Step 5: Verify GitHub CI**
  
  Inspect actual PR workflow runs and check status. Expected: all required checks pass. If a check fails, inspect job logs, fix the cause, and rerun until green. If blocked by permissions, secrets, or external infrastructure, state the exact blocker and never report green without evidence.

## Unresolved product decisions

- None blocking the approved direction. Specific visual details should follow the existing product identity and Solar reference; preserve current route and workflow semantics unless repository evidence reveals a defect requiring separate discussion.
