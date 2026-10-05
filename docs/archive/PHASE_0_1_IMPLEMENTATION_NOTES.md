# Phase 0–1 Implementation Notes

## Completed in this branch

### Phase 0 — Baseline governance

- Added the UI/UX Master Remediation Specification.
- Added a dedicated accessibility acceptance gate.
- Established a product-wide keyboard-focus contract.
- Added a product-wide reduced-motion baseline.

### Phase 1 — Foundation hardening

- Removed the duplicate `frontend-page` utility declaration from `app/globals.css`.
- Removed the standalone raw `--radius-lg`, `--margin-30`, and `--text-40` theme declarations that conflicted with the shared radius system.
- Added named spacing and control-height design-system tokens for future feature work.
- Removed the global `focus-visible:ring-[0px]` override from inputs and textareas so keyboard focus remains visibly indicated.

## Intentionally not closed yet

The following items require component-level implementation and verification rather than a global CSS-only change:

- complete async loading/success/error/stale state matrix;
- contextual accessible names for repeated catalog actions;
- mobile navigation focus management and disclosure semantics;
- automated viewport/accessibility regression tests;
- canonical-vs-legacy UI deprecation/removal;
- migration of feature-level raw colors and spacing to semantic tokens.

These remain P0/P1 backlog items in the master remediation specification and must not be marked complete until verified.
