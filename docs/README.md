# Documentation Guide

This directory contains the current operating guides and engineering records for Tech Stack Architect.

The root [README](../README.md) explains the product, workflow, setup, and contribution path. This directory adds the technical detail needed to understand, deploy, verify, and maintain the project.

## Start here

| Document | Purpose |
| --- | --- |
| [Vercel deployment](./vercel-deployment.md) | Current production deployment, environment, domain, and verification checklist |
| [Current project state](./current-project-state.md) | Concise snapshot of architecture, repository boundaries, deployment, and known verification limits |
| [UX audit and remediation](./ux-audit-and-remediation.md) | Product and interface quality decisions |

## Architecture and engineering

These records explain implementation decisions and system boundaries:

- [UI/UX master remediation specification](./UI_UX_MASTER_REMEDIATION_SPEC.md)
- [Supabase repository phase](./phase-3a2-supabase-repository.md)
- [Persistence API phase](./phase-3a3-persistence-api.md)
- [Provider persistence phase](./phase-3a4-provider-persistence.md)
- [Project persistence UI phase](./phase-3a5-project-persistence-ui.md)
- [CSRF and origin hardening](./phase-csrf-origin-hardening.md)
- [Production runtime security](./phase-production-runtime-security.md)
- [Route integrity and security](./phase-security-route-integrity.md)

## QA and verification

These documents record what was checked and what remains a manual responsibility:

- [Final QA evidence](./FINAL_QA_EVIDENCE.md)
- [Visual QA notes](./qa-visual-notes.md)
- [Visual verification](./visual-verification.md)
- [shadcn migration QA report](./shadcn-migration-qa-report.md)

QA records distinguish automated/source-level verification from browser, device, and assistive-technology verification. A passing CI run is not treated as proof of every user-facing behavior.

## Migration and historical records

These documents preserve useful project history without being treated as the current operating instructions:

- [Next.js deployment entrypoint report](./nextjs-deployment-entrypoint-report.md)
- [shadcn template migration report](./shadcn-template-migration-report.md)
- [Next.js + Hostinger deployment history](./nextjs-hostinger-deployment.md)
- [PR #38 reconciliation report](./PR38_RECONCILIATION_REPORT.md)

The Hostinger document is retained because it records a real migration/debugging path. **Hostinger is not the current production deployment target.** Use the Vercel guide for current deployment work.

## Documentation rules

1. **Current state beats historical state.** If an older engineering record conflicts with the current README or deployment guide, treat the older record as historical.
2. **Separate fact from intent.** Do not document planned work as completed work.
3. **Separate source evidence from runtime evidence.** Code presence does not prove production behavior.
4. **Record verification boundaries.** State whether something was checked by CI, source inspection, browser testing, or production observation.
5. **Keep secrets out.** Never document credentials, service-role keys, private tokens, or copied environment values.
6. **Update the nearest guide when behavior changes.** Deployment changes belong in the deployment guide; architecture changes belong in the relevant architecture record.
7. **Prefer one current source of truth.** Avoid duplicating mutable project facts across many pages.

For a product-level overview, start with the [root README](../README.md).
