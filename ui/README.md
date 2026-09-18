# Legacy UI Boundary

This directory contains the pre-Next.js static UI implementation of Tech Stack Architect.

## Status

**Deprecated — compatibility/reference only.**

The canonical application is the Next.js App Router implementation under `app/`, with reusable product components under `components/` and shared logic under `lib/`.

## Rules

- Do not add new product features to this directory.
- Do not create new imports from the canonical Next.js application into `ui/`.
- Treat changes here as migration, security, or archival work only.
- Keep the directory intact until its consumers and operational dependencies have been verified as zero.

## Removal gate

The directory may be removed in a dedicated cleanup change only after:

1. repository-wide references/imports have been verified to be absent;
2. the legacy static entrypoint is confirmed to be outside the supported production path;
3. the canonical Next.js application has equivalent required behavior;
4. automated checks and the production build pass in an environment with dependencies installed; and
5. the deletion is reviewed as a separate, auditable change.

This boundary intentionally avoids deleting legacy code merely because it appears unused.
