# Tech Stack Architect — UI/UX Master Remediation Specification

**Status:** Approved implementation blueprint  
**Source:** Reconciled Lead UI/UX audit + independent Manus audit  
**Scope:** Canonical Next.js product surface and its design-system governance  
**Target:** Production-grade, accessible, responsive, human-centered architecture workspace

---

## 1. Executive Decision

Tech Stack Architect is **not a redesign project**. The existing product direction, information model, guided workflow, card language, semantic status treatment, and engineering foundation should be preserved.

The remediation goal is to convert a credible product UI into a **governed, testable, scalable design system**.

### Current verdict

**NEEDS REVISION**

### Target verdict

**PASS — 5-Star Product UI / Design-System Readiness**

The target is achieved only when the P0 and P1 acceptance gates are satisfied and the final validation suite produces no unresolved Critical or High findings.

---

## 2. Evidence Base

Two independent audits were reconciled:

1. Lead UI/UX and Design Systems Audit — repository + published interface review.
2. Manus independent audit — repository, live interface, engineering checks, accessibility and design-system review.

The Manus audit verified the current engineering baseline as follows:

| Check | Result |
|---|---|
| Frozen dependency installation | Passed |
| TypeScript check | Passed |
| Tests | 119 passed, 0 failed |
| Lint | Passed with 9 warnings |
| Published interface | Reachable and inspected |

The README identifies `https://architect.ediccrew.com` as the live application and describes the product as a requirements-to-architecture workflow: requirements → analysis → recommendation review → compatibility validation → blueprint. The product intent is to make technology selection explainable rather than presenting an unexplained tool list.

**Important:** The audits did not constitute a complete screen-reader audit, statistically representative user study, or complete automated contrast scan. Those remain validation work, not assumed facts.

---

## 3. Unified Priority Model

### P0 — Release-blocking quality

Issues affecting accessibility, state comprehension, keyboard interaction, data integrity, or predictable user recovery.

### P1 — Product/system quality

Issues affecting information hierarchy, responsive reliability, design-system consistency, maintainability, and canonical architecture.

### P2 — System maturity

Documentation, polish, consistency, governance, and developer-experience improvements.

### P3 — Optional refinement

Low-impact visual refinement that does not materially affect comprehension, accessibility, or system integrity.

---

# 4. P0 Remediation Program

## P0.1 Accessibility Regression Gate

### Objective

Make accessibility an enforceable engineering requirement rather than an inferred property of the UI.

### Required coverage

- Keyboard-only navigation.
- Visible focus on every interactive control.
- Logical tab order.
- Focus restoration after menus/dialogs/disclosures close.
- Mobile navigation disclosure behavior.
- Project form validation.
- Async analysis state.
- Validation results.
- Technology filters.
- Repeated Add to Stack actions.
- Persistence controls.
- Theme switching.
- Blueprint/export areas.
- Reduced-motion behavior.
- Automated axe or equivalent checks.
- Manual screen-reader verification with a representative desktop and mobile assistive technology workflow.

### Acceptance criteria

- No unresolved Critical/Serious automated accessibility violations.
- Every interactive element has an accessible name.
- Every invalid form control is programmatically associated with its error/help text.
- Dynamic result/status changes are announced where appropriate.
- Focus is never lost after a disclosure, dialog, navigation transition, or async operation.
- Color is never the sole carrier of meaning.
- Minimum target sizes are preserved for touch controls.

---

## P0.2 Complete Async and Validation State Contract

Every consequential operation must have explicit states:

| State | Required UX |
|---|---|
| Default | Action is available and understandable. |
| Loading | Progress is visible and duplicate submission is prevented. |
| Success | Outcome is explicit and next action is obvious. |
| Partial success | Completed and incomplete portions are distinguished. |
| Error | Cause/actionable recovery is clear. |
| Invalid input | Field-level correction is clear and linked. |
| Empty | Explain why no result exists and what to do next. |
| Stale result | Make it clear when displayed analysis no longer represents current inputs. |
| Disabled | Explain why the action is unavailable where necessary. |
| Offline/persistence failure | Preserve user work and provide recovery guidance where applicable. |

### Acceptance criteria

- Analysis has a loading state.
- Analysis success and failure are distinct.
- Validation errors identify affected technologies/fields.
- Async status changes use appropriate live regions.
- Corrected input produces a deterministic refreshed result.
- Stale analysis cannot silently masquerade as current analysis.

---

# 5. P1 Information Architecture and Density

## P1.1 Establish Guided Mode as the Primary Experience

The current workspace places navigation, status metrics, six-step workflow, project form, recommendations, and a large technology catalog on one long surface. The product's conceptual workflow is linear even though the page presents many sections simultaneously.

### Required direction

Preserve the six-step workflow:

1. Define
2. Analyze
3. Review
4. Build
5. Validate
6. Blueprint

But make the **active step the primary visual and cognitive unit**.

### Default guided-mode behavior

- Show the current step prominently.
- Show only information required for the current decision.
- Defer lower-priority catalog/detail content until relevant.
- Collapse or move secondary content out of the initial decision path.
- Preserve access to the full workspace for experienced users.
- Do not remove discoverability; reduce simultaneous cognitive load.

### Acceptance criteria

A first-time user can understand:

- Where they are.
- What the current task is.
- Why the task matters.
- What information is required.
- What the primary next action is.

without needing to parse the entire catalog or every later workflow stage.

---

## P1.2 Navigation Hierarchy

Define three navigation layers and do not let them compete:

### Global navigation
Destinations such as workspace, saved projects, settings, or external resources.

### Workflow navigation
The six architecture steps and current progress.

### In-page navigation
Anchors/section navigation only when a long section genuinely needs it.

### Rule

Global navigation answers **"Where can I go?"**  
Workflow navigation answers **"Where am I in the task?"**  
In-page navigation answers **"Where am I inside this section?"**

---

# 6. P1 Canonical UI Surface

## P1.1 Eliminate Canonical/Legacy Ambiguity

The audits identified a retained legacy `ui/` frontend and root redirect alongside the canonical Next.js `app/` surface.

### Required action

Create a formal deprecation boundary:

- Declare the Next.js `app/` surface canonical.
- Mark legacy UI read-only/deprecated.
- Document ownership.
- Document the legacy removal condition.
- Add route/redirect tests.
- Prevent new feature work from entering the legacy surface.
- Remove legacy surface once parity and deployment validation are complete.

### Acceptance criteria

There is one documented source of truth for product UI implementation.

No new component, token, route, or interaction is introduced into the legacy UI.

---

# 7. P1 Design Token System

## 7.1 Spacing

Adopt a named 4pt base scale:

`4, 8, 12, 16, 24, 32, 40, 48`

Non-scale values require an explicit reason.

### Named layout contracts

- Page inset
- Content max width
- Rail width
- Section gap
- Field gap
- Card padding
- Control gap
- Inline action gap

Do not rely on repeated ad-hoc utility strings as the design contract.

## 7.2 Typography

Define roles rather than arbitrary utility combinations:

- Display
- Page title
- Section title
- Body
- Label
- Helper
- Metadata
- Status

Each role must specify:

- Font size
- Weight
- Line height
- Letter spacing where needed
- Intended content length
- Contrast requirement

Avoid unnecessarily tiny text for normal informational content.

## 7.3 Color

Replace feature-specific color intent with semantic roles:

- `surface-default`
- `surface-subtle`
- `surface-elevated`
- `text-primary`
- `text-secondary`
- `text-muted`
- `border-default`
- `focus-ring`
- `status-info`
- `status-success`
- `status-warning`
- `status-destructive`
- `status-loading`
- `status-not-checked`
- `category-accent`

Each role must define light/dark values and contrast expectations.

## 7.4 Radius and Elevation

Choose a small governed radius family and a small governed elevation family.

Do not allow arbitrary radius values to proliferate.

Document primitive exceptions.

## 7.5 Control Dimensions

Define shared control contracts for:

- Small
- Default
- Large

Every interactive control must define:

- Default
- Hover
- Focus-visible
- Pressed/active
- Disabled
- Loading
- Invalid/error where applicable

Touch targets must remain at least 44×44 CSS pixels for primary interactive targets, with platform-specific review where necessary.

---

# 8. P1 Component State Matrix

The product's core interactive components must be audited against this matrix:

| Component | Default | Hover | Focus | Pressed | Disabled | Loading | Error | Empty | Success |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Button | ✓ | ✓ | ✓ | Required | ✓ | Required | Contextual | — | Contextual |
| Input | ✓ | ✓ | ✓ | — | ✓ | Contextual | ✓ | — | Contextual |
| Select | ✓ | ✓ | ✓ | Required | ✓ | Contextual | ✓ | ✓ | Contextual |
| Textarea | ✓ | ✓ | ✓ | — | ✓ | Contextual | ✓ | — | Contextual |
| Technology card | ✓ | ✓ | ✓ | Required | Contextual | Contextual | ✓ | — | ✓ |
| Add to Stack | ✓ | ✓ | ✓ | Required | ✓ | Required | Contextual | — | ✓ |
| Navigation toggle | ✓ | ✓ | ✓ | Required | — | — | — | — | ✓ |
| Validation panel | ✓ | — | — | — | — | Required | ✓ | ✓ | ✓ |
| Toast/status | — | — | — | — | — | Required | ✓ | — | ✓ |
| Modal/popover | ✓ | — | ✓ | — | — | Contextual | Contextual | — | Contextual |

**Required** means the state must be deliberately implemented and tested, not merely inherited by accident.

---

# 9. P1 Responsive Specification

Required regression matrix:

| Viewport | Primary goal |
|---|---|
| 320px | Minimum supported narrow mobile behavior |
| 375px | Common mobile baseline |
| 390px | Common modern mobile baseline |
| 480px | Large mobile |
| 768px | Tablet transition |
| 1024px | Large tablet/small desktop |
| 1280px | Desktop baseline |
| 1440px | Large desktop |

### Required verification

For each breakpoint verify:

- Navigation.
- Header.
- Workflow stepper.
- Project form.
- Technology cards.
- Filters.
- Validation panel.
- Blueprint output.
- Dialogs/popovers.
- Touch targets.
- Keyboard focus.
- Overflow/clipping.
- Long labels and content.
- Dark mode.

### Tablet requirement

The 768–1024 range must have an explicit layout contract rather than being treated as a side effect of mobile/desktop breakpoints.

---

# 10. P1 Accessibility Contracts

## Forms

- Visible labels.
- Programmatic label association.
- Helper/error association with `aria-describedby` where appropriate.
- `aria-invalid` on invalid controls.
- Error summary for multi-error submissions where useful.
- Focus movement after failed submission must be predictable.

## Dynamic content

- Use appropriate `aria-live` regions for meaningful asynchronous changes.
- Do not announce decorative changes.
- Avoid excessive repeated announcements.

## Repeated actions

Visible text such as `Add to Stack` must have a contextual accessible name, e.g. `Add Next.js to stack`.

## Navigation disclosure

Mobile navigation must expose:

- `aria-expanded`
- `aria-controls`
- Correct focus handling
- Escape behavior where appropriate
- Focus restoration after close

## Motion

Introduce a global `prefers-reduced-motion` policy.

When reduced motion is requested:

- Remove or minimize non-essential movement.
- Preserve state changes and feedback.
- Do not make essential information depend on animation.

---

# 11. P1 Status Semantics

Validation and compatibility information must never depend on color alone.

Each state should combine:

**icon + label + message + optional action**

Recommended semantic vocabulary:

- Success
- Warning
- Error
- Information
- Loading
- Not checked
- Suggestion

The user should be able to understand the state in grayscale and through assistive technology.

---

# 12. P1 Component Composition Rules

Feature code should compose shared primitives first.

Native controls are permitted only when:

- Native behavior is intentionally preferred, and
- The reason is documented, and
- Accessibility/responsive behavior is verified.

Standardize repeated controls such as selects, buttons, cards, focus rings, status badges, and icon treatment.

### Icon governance

Define:

- Default icon library.
- Approved exceptions.
- Standard sizes.
- Stroke/weight behavior.
- Optical alignment rules.
- Decorative vs semantic icon rules.
- Accessible labeling rules.

---

# 13. P2 Design-System Documentation

Create a living design-system reference, preferably `docs/design-system.md` initially and optionally Storybook/equivalent later.

Each major component family must document:

1. Purpose
2. Anatomy
3. Variants
4. States
5. Content rules
6. Accessibility contract
7. Responsive behavior
8. Do/Don't examples
9. Token dependencies
10. Example implementation

This documentation should be decision-oriented, not a historical archive.

---

# 14. P2 Engineering Quality

Resolve the current lint warnings.

Priority order:

1. Dependency warning that can create stale interaction/search behavior.
2. Unused variables/imports.
3. Unused authorization symbols.
4. Any warning introduced by remediation work.

Target:

**Zero lint warnings**, or an explicitly documented and reviewed exception.

---

# 15. P2 Automated Visual Regression

Introduce browser-level regression coverage for the core workflow.

Minimum scenario set:

1. Load workspace.
2. Open/close mobile navigation.
3. Complete project definition.
4. Trigger analysis.
5. Review recommendations.
6. Add/remove technology from stack.
7. Open technology details.
8. Filter/search catalog.
9. Trigger validation.
10. Correct an invalid state.
11. Save/reopen project where configured.
12. Reach blueprint.
13. Switch theme.

Run against the responsive matrix defined in Section 9.

Visual regression should check both layout and interaction outcome, not screenshots alone.

---

# 16. AI / Vibe-Coded Smell-Test Gate

The product should not merely look polished; it should demonstrate intentional engineering and design decisions.

Final review must explicitly test for:

- Arbitrary styling that lacks a system rationale.
- Repeated one-off components that should be shared.
- Generic dashboard patterns without product-specific purpose.
- Decorative motion without functional value.
- Copy that sounds generated rather than task-oriented.
- Inconsistent terminology.
- Duplicate navigation models.
- Hidden assumptions in responsive behavior.
- Accessibility added only after visual completion.
- Error states that are visually styled but not semantically modeled.
- Components that appear reusable but have incompatible APIs.
- Token systems that exist only in CSS but are not used by feature code.

The target is **intentional product engineering**, not visual complexity.

---

# 17. File-Level Remediation Map

Initial files/surfaces identified by the audits for direct review:

### Core styling

- `app/globals.css`

Review:

- focus-visible behavior
- spacing tokens
- typography tokens
- radius tokens
- duplicate utilities
- reduced motion
- semantic colors

### Dashboard shell

- `app/(dashboard-layout)/layout.tsx`
- `app/(dashboard-layout)/page.tsx`

Review:

- global vs contextual navigation
- content width
- rail density
- workflow hierarchy
- responsive collapse

### Project form

- `components/architect/project-definition-form.tsx`

Review:

- state matrix
- focus behavior
- validation association
- loading/submit behavior
- field spacing
- control token usage

### Technology card

- `components/architect/component-card.tsx`

Review:

- contextual accessible names
- pressed/disabled/loading states
- card information density
- semantic status treatment
- token usage

### Validation

- `components/architect/validation-panel.tsx`

Review:

- status semantics
- async announcements
- empty/loading/error/success states
- error recovery
- non-color encoding

### Catalog/filtering

- `components/architect/component-browser.tsx`

Review:

- filter semantics
- keyboard interaction
- responsive card density
- native/shared select consistency

### Legacy surface

- retained `ui/` frontend
- root `index.html` redirect
- migration/deployment documentation

Review:

- canonical routing
- deprecation boundary
- removal readiness

---

# 18. Implementation Sequence

## Phase 0 — Baseline and safety

- Freeze visual direction.
- Confirm canonical route.
- Capture current responsive screenshots.
- Establish accessibility baseline.
- Record current lint/test/type results.

**Exit gate:** Baseline is reproducible.

## Phase 1 — P0 accessibility and state system

- Fix focus-visible behavior.
- Complete keyboard/focus model.
- Complete async states.
- Complete validation/error association.
- Add reduced-motion behavior.
- Add accessible names to repeated actions.
- Add automated accessibility tests.

**Exit gate:** No unresolved P0 findings.

## Phase 2 — Information architecture and responsive system

- Establish guided mode.
- Reduce first-use density.
- Clarify navigation layers.
- Define tablet behavior.
- Add viewport regression tests.

**Exit gate:** Core workflow works predictably at all required breakpoints.

## Phase 3 — Design-system systematization

- Introduce semantic tokens.
- Normalize control dimensions.
- Normalize radius/elevation.
- Normalize typography.
- Normalize semantic colors.
- Standardize primitive composition.
- Establish icon rules.

**Exit gate:** New feature UI can be implemented without inventing new visual rules.

## Phase 4 — Legacy retirement and documentation

- Mark legacy surface deprecated.
- Stop feature development there.
- Create living design-system documentation.
- Remove legacy surface when route/deployment validation passes.
- Clean all lint warnings.

**Exit gate:** One canonical UI system and zero unresolved governance ambiguity.

## Phase 5 — Final 5-Star validation

Run the complete validation matrix:

- UX
- Visual hierarchy
- spacing
- responsive
- component states
- accessibility
- semantic status
- design tokens
- engineering hygiene
- visual regression
- AI/vibe-coded smell test

**Exit gate:** PASS.

---

# 19. Definition of Done

The project may be declared **5-Star UI/UX Ready** only when all conditions below are true:

### Product

- Guided workflow is obvious.
- First-use cognitive load is controlled.
- Primary actions are clear.
- Error recovery is understandable.
- Status is trustworthy and actionable.

### Visual system

- Spacing follows the named scale.
- Typography roles are documented.
- Semantic color roles are documented.
- Radius/elevation are governed.
- Components use consistent primitives.

### Responsive

- 320–1440px matrix passes.
- Tablet behavior is explicit.
- No clipping/overflow defects.
- Touch targets are appropriate.
- Mobile navigation is fully tested.

### Accessibility

- Automated accessibility gate passes.
- Keyboard-only flow passes.
- Screen-reader critical paths pass manual verification.
- Focus is visible and predictable.
- Dynamic changes are announced appropriately.
- Color is not the sole semantic carrier.
- Reduced motion is supported.

### Engineering

- Type check passes.
- Tests pass.
- Lint has zero warnings or documented exceptions.
- Visual regression suite passes.
- Legacy UI has a defined retirement path or is removed.

### Governance

- Design-system documentation exists.
- Component states are documented.
- Accessibility contracts are documented.
- Responsive contracts are documented.
- Token usage is enforceable.
- New UI work has a defined acceptance checklist.

### Human-centered quality

- Copy is understandable without design expertise.
- The product explains why decisions matter.
- The system helps users recover rather than merely report failure.
- Complexity is revealed progressively.
- The interface feels like a deliberate architecture tool rather than a generic AI-generated dashboard.

---

# 20. Final Validation Verdict

## Current

**NEEDS REVISION**

## Target

**PASS**

The route to PASS is **systematization, not wholesale redesign**.

The highest-value work is:

1. Accessibility + state completeness.
2. Guided-mode density reduction.
3. Canonical UI consolidation.
4. Semantic design-token governance.
5. Responsive and visual regression automation.
6. Living design-system documentation.

Once these are implemented, the existing product direction can remain intact while its reliability, accessibility, scalability, and professional quality increase substantially.
