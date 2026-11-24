# Phase 1 production-readiness rollout checkpoint

**Last verified:** 24 November 2026  
**Repository:** `davidifeanyicelestine586-arch/tech-stack-architect`  
**Active implementation PR:** [#91 — Phase 1 production readiness foundations](https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/pull/91)  
**Implementation branch:** `feat/phase-1-production-readiness`

This is an operational checkpoint, not production deployment approval. No workspace migration or production data mutation was performed during this review.

## Verified repository state

- PR #89 (`feat/phase-1-product-blueprint`) remains open and draft.
- PR #91 is based on PR #89's head and is 55 commits ahead with no commits behind at the time of comparison.
- PR #91 remains open and draft.
- PR #91's latest reviewed commit before this checkpoint was `6139ef0`; its six workflows passed: Quality Gate, SEO Release Verification, Header Responsive Collision Audit, Lighthouse Performance Baseline, Accessibility Regression, and Workspace database integration.
- PR #91 has a successful Vercel preview deployment. A preview deployment is not production smoke-test evidence.
- The active production branch is documented as `main`.

## Production database observations

The connected Supabase project reported:

- PostgreSQL 17.11 (major version 17), region `eu-west-1`.
- Recorded migration versions:
  - `20260824000000` — `create_projects`
  - `20260909131926` — `add_authenticated_project_rls`
  - `20261116085154` — `project_snapshot_v2`
- The public schema inspection returned the existing `public.projects` table with RLS enabled. The Phase 1 workspace tables were not present.
- `pgcrypto` is installed in the `extensions` schema.
- `pg_cron` is available but not installed; the current expiry scheduler uses GitHub Actions instead.
- No workspace migration has been applied to this project during this work.

### Migration-history reconciliation — release blocker

The repository migration filenames currently use these versions:

- `20260824000000_create_projects.sql`
- `20260909000000_add_authenticated_project_rls.sql`
- `20261116000000_project_snapshot_v2.sql`

The latter two version prefixes do not match the recorded production versions, although their migration names match. Supabase migration identity is version-based. Do not run `supabase db push`, `migration repair`, or apply the Phase 1 migrations until the content of the already-applied production migrations has been reconciled with the repository files and a reviewed migration-history repair plan has been approved.

The Phase 1 workspace migrations are the nine files beginning `20261117000000` through `20261117080000`. Their application must be tested against the production PostgreSQL major version and a production-schema-compatible fixture before rollout.

## CI compatibility change

The workspace database integration workflow was changed from `postgres:16` to `postgres:17` to match the connected production major version.

The PostgreSQL 17 integration run completed successfully on commit `4b28cba`. This verified the migration chain and tenant-isolation SQL in a disposable CI database; it did not change or validate the production database itself.

## Scheduled invitation maintenance

The GitHub Actions workflow `.github/workflows/workspace-invitation-maintenance.yml` runs daily at 03:17 UTC and can also be started manually.

It requires repository Actions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The workflow was hardened to fail visibly if either secret is missing or the URL is not HTTPS. Secret presence and a successful scheduled/manual execution have not yet been verified. Do not treat an unexecuted or skipped maintenance job as evidence that expiry processing is operational.

## Supabase security and performance findings

The Supabase security advisor reported:

- **Warning:** leaked-password protection is disabled in Supabase Auth. Enable and verify this setting in the Supabase Auth security configuration before production rollout.

The performance advisor reported four existing RLS policy warnings on `public.projects` because `auth.uid()` is re-evaluated per row. The suggested optimization is to wrap the call as `(select auth.uid())`. These are performance findings, not proof of an authorization bypass. Assess them separately and test the replacement policies before applying any production DDL.

The health advisor returned no findings at the time of inspection.

## Remaining release gates

1. Reconcile the two production migration-version mismatches and prove the repository's baseline migration contents match what is already applied.
2. Add/maintain a PostgreSQL 17 migration and RLS integration gate (now updated; the latest run must be green on the current PR head).
3. Verify the GitHub Actions secrets are configured without exposing their values, then execute the invitation-maintenance workflow and confirm the RPC succeeds.
4. Enable Supabase leaked-password protection and record verification.
5. Review and, if approved, remediate the four existing RLS performance warnings in a separate tested migration.
6. Prepare a production backup and prove the restore procedure for the deployed Supabase plan.
7. Review the full Phase 1 migration diff, data backfill effects, RLS and service-role boundaries, and rollback/recovery plan.
8. Obtain explicit production migration approval before applying any workspace migration.
9. After an approved migration, run production smoke tests for auth, workspace creation/selection, invitations, membership, project access, persistence, and audit events.
10. Complete invitation email delivery separately after sender-domain verification and email-provider approval.

## Current decision

**Do not merge PR #91 or apply migrations to production yet.** Keep PR #91 as a draft until the current CI run is green, migration history is reconciled, required secrets and Auth security settings are verified, and backup/restore and rollout plans are approved.

Email delivery remains a separate decision and is not silently assumed to use any provider.
