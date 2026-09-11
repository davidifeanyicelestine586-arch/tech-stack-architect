# Accessibility Acceptance Gate

This is the release gate for the Tech Stack Architect UI/UX remediation program. It complements the UI/UX Master Remediation Specification and records what must be verified before accessibility-related work is considered complete.

## Automated baseline

- `pnpm lint` — zero errors; warnings must be resolved or explicitly documented.
- `pnpm check` — TypeScript must pass.
- `pnpm test` — existing test suite must pass.
- Add browser accessibility checks before closing P0.

## Keyboard contract

Verify with keyboard only at desktop and mobile viewport widths:

- Every interactive control is reachable in a logical order.
- Every focused control has a visible focus indicator.
- Focus is never trapped unexpectedly.
- Opening a disclosure, dialog, or mobile navigation region exposes its state and returns focus predictably when closed.
- Escape closes dismissible overlays where appropriate.
- No action requires pointer-only interaction.

## Form contract

For the project-definition flow:

- Every field has an associated accessible name.
- Help text and validation errors are programmatically associated with their field.
- Invalid fields expose an invalid state.
- Submit/loading/success/error states are communicated to assistive technology.
- Async result updates use an appropriate live region without excessive announcement noise.
- Correcting an error does not remove the user's context or unexpectedly move focus.

## Repeated-action contract

Actions repeated across technology cards must have contextual accessible names. For example, a visible `Add to Stack` control should expose an accessible name equivalent to `Add <technology> to stack`.

## Responsive contract

Regression checks must cover at least:

| Viewport | Required areas |
| --- | --- |
| 375px | shell, mobile navigation, form, catalog, validation |
| 390px | shell, mobile navigation, form, catalog, validation |
| 768px | shell, workflow, form, catalog, validation |
| 1024px | shell, workflow, form, catalog, validation |
| 1280px | complete workspace |
| 1440px | complete workspace |

Check for clipping, horizontal overflow, unreachable controls, broken focus visibility, and inconsistent component states.

## Motion contract

The product must honor `prefers-reduced-motion: reduce`. Decorative and transitional animation should be minimized or disabled while preserving meaning and task completion.

## Manual assistive-technology pass

Before P0 closure, manually verify the primary workflow with at least one desktop screen reader and one mobile accessibility technology. Record tool, browser/OS, date, findings, and remediation status in the QA record.

## Evidence requirement

A P0 item is not considered closed because the implementation looks correct. The closure record must identify:

1. the tested route or component;
2. viewport/device context;
3. interaction path;
4. expected behavior;
5. observed result;
6. any remaining limitation.

Unknown behavior must be recorded as `Missing Specification` until verified.
