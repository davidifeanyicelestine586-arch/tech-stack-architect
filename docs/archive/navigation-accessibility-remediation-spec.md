# Navigation & Accessibility Remediation Specification

## Purpose

This specification translates the recent navigation/header/accessibility audits into a repo-grounded remediation plan for Tech Stack Architect.

It deliberately distinguishes verified findings from audit claims that are not supported by the current `main` source.

## Verified baseline

| Area | Status | Evidence |
| --- | --- | --- |
| Responsive navigation | Confirmed issue | Desktop and mobile navigation trees are rendered separately in `app-sidebar.tsx`. |
| Mobile disclosure semantics | Confirmed issue | Header toggle has an accessible label but does not expose `aria-expanded` or `aria-controls`. |
| Hash synchronization | Not confirmed as broken | `nav-collapse` listens for `hashchange` and derives active state from pathname + hash. |
| `aria-current` | Not confirmed as hard-coded | Current value is calculated from the active route/hash. |
| New Project control | Already remediated | Uses a native Button with accessible labeling and focus styles. |
| Workflow/navigation overlap | Confirmed architectural concern | Navigation registry and workflow progress model both describe the same user journey at different abstraction levels. |
| Step numbering | Confirmed inconsistency | Workspace copy contains hard-coded Step 4 labels while workflow progress derives a six-step sequence. |
| Skip link | Missing | No skip-to-content implementation is present. |
| Touch targets | Largely addressed | Primary controls use 44px-class sizing; remaining exceptions require rendered QA. |
| Heading hierarchy | Not confirmed as fundamentally broken | Current source contains a real H1 followed by H2/H3 content headings. |
| Metadata | Confirmed inconsistency | Root and workspace metadata use different title/description variants. |
| Static navigation contract | Already present | `tests/navigation-contract.test.mjs` validates route and anchor invariants. |
| Rendered navigation/a11y regression coverage | Missing | No browser-level navigation/accessibility regression suite was found in the inspected tests. |

## Goals

1. Provide one canonical navigation model.
2. Make the mobile navigation state machine explicit to assistive technology.
3. Separate navigation destination state from workflow-progress state.
4. Eliminate duplicated/hard-coded workflow numbering.
5. Provide a reliable skip-to-content path.
6. Normalize document metadata.
7. Add rendered regression coverage for keyboard, responsive navigation, active state, and landmark behavior.

## Non-goals

- Do not add ARIA roles where native HTML semantics already provide the correct landmark/control.
- Do not replace working hash synchronization with a speculative routing rewrite.
- Do not change product information architecture solely to satisfy an external audit.
- Do not treat source-level audit observations as rendered-browser facts without verification.

## Remediation plan

### P0 — Navigation architecture

#### 1. Consolidate responsive navigation

Create one canonical navigation data/tree and one reusable renderer.

The existing `lib/navigation/routes.ts` registry remains the source of truth for destinations. Desktop and mobile presentations should consume the same route model rather than maintaining two independently rendered navigation trees.

Acceptance criteria:
- One route model drives both desktop and mobile navigation.
- Adding/removing a destination requires changing the navigation registry rather than two JSX trees.
- Desktop and mobile expose the same intended destination set unless an explicit product rule documents an exception.
- Existing navigation contract tests continue to pass.

#### 2. Define the mobile disclosure contract

The mobile navigation trigger must expose:
- `aria-expanded` reflecting open/closed state.
- `aria-controls` pointing to the controlled mobile navigation region.
- A stable accessible name.
- Keyboard-operable native button semantics.

Acceptance criteria:
- Closed state reports `aria-expanded="false"`.
- Open state reports `aria-expanded="true"`.
- `aria-controls` resolves to the mobile navigation container.
- Escape/close behavior remains functional where supported by the existing Sheet implementation.
- Focus behavior is verified in a browser test.

### P1 — State and workflow consistency

#### 3. Separate navigation state from workflow state

Document and implement the distinction:

- **Navigation state:** the destination currently selected/open, including pathname and section hash.
- **Workflow state:** the user's current architecture stage: Define, Analyze, Review, Build, Validate, Blueprint.

The workflow model should remain canonical for stage labels and progress. Navigation should map to workflow stages instead of independently inventing stage semantics.

Acceptance criteria:
- A single source defines the six workflow stages.
- Navigation mappings reference workflow identifiers rather than duplicating labels where practical.
- Active navigation remains correct for both route and hash changes.
- Workflow progress does not drift when navigation destinations change.

#### 4. Remove hard-coded step numbers

Replace page copy such as hard-coded “Step 4” labels with values derived from the canonical workflow definition, or rewrite the copy so it does not encode a potentially stale ordinal.

Acceptance criteria:
- No duplicated hard-coded workflow ordinals remain for the same stage.
- The displayed step number and workflow progress agree.
- Tests cover the six-stage ordering.

### P1 — Accessibility

#### 5. Add a skip link

Add a keyboard-accessible “Skip to main content” control at the application-shell level.

Acceptance criteria:
- The link is reachable as the first meaningful keyboard navigation target.
- It points to the main content container.
- It becomes visibly discoverable on focus.
- The main content target has a stable `id`.
- No redundant `role="main"` is introduced where native `<main>` already exists.

#### 6. Verify focus and touch targets in rendered UI

Do not make blanket source-only changes. Use browser verification to check:
- visible `:focus-visible` treatment;
- keyboard traversal order;
- mobile trigger reachability;
- minimum practical target sizing;
- no keyboard traps;
- active navigation visibility.

### P2 — Metadata

#### 7. Normalize title and description

Establish one canonical product naming convention across:
- document title;
- meta description;
- Open Graph title/description;
- Twitter title/description.

Workspace-specific metadata may remain distinct when the page genuinely requires it, but it should use the same product naming and description vocabulary.

Acceptance criteria:
- No contradictory product names such as “Ediccrew” vs “Ediccrew Tech Stack Architect” appear across equivalent metadata fields.
- Description text is intentionally differentiated only when page context requires it.
- Empty/placeholder metadata fields are removed.

### P2 — Verification

#### 8. Add rendered navigation/accessibility regression tests

Extend the existing static navigation contract with browser-level tests.

Minimum scenarios:
1. desktop navigation renders the canonical destination set;
2. mobile trigger exposes expanded/collapsed state;
3. mobile navigation opens and closes;
4. keyboard can reach the trigger and navigation links;
5. active state updates after hash navigation;
6. direct deep links preserve the correct active destination;
7. skip link moves focus to main content;
8. main landmark exists exactly once;
9. no duplicate visible navigation landmarks are exposed at the same viewport;
10. workflow step label and progress indicator agree.

Prefer the project's existing browser/test stack where available; otherwise introduce the smallest appropriate browser harness.

## Implementation order

1. Canonical navigation renderer/data consumption.
2. Mobile disclosure semantics.
3. Canonical workflow model and step numbering.
4. Skip link.
5. Metadata normalization.
6. Browser regression coverage.
7. Run lint, typecheck, unit/static tests, build, and browser checks.

## Verification gates

A remediation change is ready for review when:

- existing navigation contract tests pass;
- unit/project workflow tests pass;
- lint and typecheck pass;
- production build passes;
- browser navigation/accessibility checks pass at desktop and mobile breakpoints;
- no new duplicate navigation landmark is introduced;
- deep-link/hash behavior remains functional.

## Source files in scope

- `lib/navigation/routes.ts`
- `app/(dashboard-layout)/layout/vertical/sidebar/app-sidebar.tsx`
- `app/(dashboard-layout)/layout/vertical/sidebar/nav-collapse/index.tsx`
- `app/(dashboard-layout)/layout/vertical/header/index.tsx`
- `components/architect/workflow-progress.tsx`
- `app/(dashboard-layout)/page.tsx`
- `app/layout.tsx`
- `tests/navigation-contract.test.mjs`
- relevant browser/test configuration and shell components

## Audit interpretation note

The external audits are useful discovery inputs, not authoritative descriptions of the current repository. In particular, current source does **not** support the claims that hash synchronization is completely broken, that `aria-current` is permanently stuck on Workspace, that New Project is a non-keyboard-operable div, or that the heading hierarchy is fundamentally invalid.

The implementation should therefore fix verified defects and verify rendered behavior before changing already-correct code.
