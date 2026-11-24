# Phase 1 production-readiness rollout checkpoint

**Last verified:** 24 November 2026, 13:20 UTC+1  
**Repository:** `davidifeanyicelestine586-arch/tech-stack-architect`  
**Active implementation PR:** [#91 — Phase 1 production readiness foundations](https://github.com/davidifeanyicelestine586-arch/tech-stack-architect/pull/91)  
**Implementation branch:** `feat/phase-1-production-readiness`

This is an operational checkpoint, not production deployment approval. No workspace migration or production data mutation was performed during this review.

## Verified repository state

- PR #89 (`feat/phase-1-product-blueprint`) remains open and draft.
- PR #91 targets `main`, remains open and draft, and currently points to `d5984dc19447893457726e39282c5f30eae6456b`.
- PR #89 (`feat/phase-1-product-blueprint`) also remains open and draft; neither PR has been merged.
- All six required workflows completed successfully on current PR #91 head `d5984dc19447893457726e39282c5f30eae6456b`: Quality Gate (run 716), Workspace database integration (run 69), Accessibility Regression (run 362), SEO Release Verification (run 394), Header Responsive Collision Audit (run 486), and Lighthouse Performance Baseline (run 399).
- The Vercel commit status is successful. A preview deployment is not production smoke-test evidence.
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

### Migration-history reconciliation — filename mismatch resolved; rollout still gated

The two repository migration files whose versions differed from the production history have been renamed on the PR #91 branch to match the exact recorded production versions:

- `20260909131926_add_authenticated_project_rls.sql`
- `20261116085154_project_snapshot_v2.sql`

The original repository files were not rewritten; the existing SQL blobs were preserved and only the versioned paths changed. The live `public.projects` columns, constraints, and four authenticated-owner RLS policies were inspected and match the definitions in those two baseline migrations. The first migration version, `20260824000000`, already matched.

This resolves the local filename/version mismatch. It does **not** constitute a migration push or production rollout. Re-run `supabase migration list` after checking out the updated branch and confirm that all three baseline versions match remote history before any apply operation. Do not run `supabase db push`, `migration repair`, or apply the Phase 1 migrations without an explicit production rollout approval.

The nine new Phase 1 workspace migrations begin at `20261117000000` and end at `20261117080000`. Their application must be tested against PostgreSQL 17 and a production-schema-compatible fixture before rollout.

## CI compatibility change

The workspace database integration workflow was changed from `postgres:16` to `postgres:17` to match the connected production major version.

The PostgreSQL 17 integration run completed successfully on current PR #91 head (`d5984dc19447893457726e39282c5f30eae6456b`, run 69). These CI runs apply the migrations to a disposable database and do not change production.

## Scheduled invitation maintenance

The GitHub Actions workflow `.github/workflows/workspace-invitation-maintenance.yml` runs daily at 03:17 UTC and can also be started manually.

It requires repository Actions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The workflow was hardened to fail visibly if either secret is missing or the URL is not HTTPS. The connected GitHub integration does not expose repository-secret endpoints, so secret presence could not be verified without accessing secret values; no secret values were requested or read. The connected GitHub actions also do not provide a workflow-dispatch operation, so a manual maintenance run and successful RPC execution remain unverified. Do not treat the workflow definition or green PR CI as evidence that expiry processing is operational.

## Supabase security and performance findings

The Supabase security advisor was re-run on 24 November 2026 and reported:

- **Warning:** leaked-password protection is disabled in Supabase Auth. Enable and verify this setting in the Supabase Dashboard under Authentication settings before production rollout. Supabase documents this feature as available on Pro plan and above; the connected project plan was not verified in this pass. See [Supabase password security documentation](https://supabase.com/docs/guides/auth/password-security).

The performance advisor was re-run on 24 November 2026 and reported four existing RLS policy warnings on `public.projects` because `auth.uid()` is re-evaluated per row. The suggested optimization is to wrap the call as `(select auth.uid())`. These are performance findings, not proof of an authorization bypass. The advisor also reported two unused-index informational findings; do not drop either index without workload evidence. The health advisor returned no findings. Assess the RLS and index findings separately and test any proposed changes before applying production DDL.


## Remaining release gates

1. **Completed:** baseline migration filenames reconciled with the three production migration versions; confirm once more with `supabase migration list` from the rollout environment before applying anything.
2. **Completed:** PostgreSQL 17 migration and RLS integration gate; all six required workflows are green on current PR #91 head.
3. **Blocked/unverified:** verify the repository Actions secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in GitHub Settings without exposing values, then manually run `Workspace invitation maintenance` and confirm the RPC succeeds.
4. **Blocked/manual dashboard action:** enable Supabase leaked-password protection (if the project plan supports it) and rerun the security advisor.
5. **Review required:** evaluate four existing RLS performance warnings and two unused-index notices; implement only evidence-backed changes in a separate tested migration.
6. **Evidence required:** verify backup coverage and execute a restore rehearsal using the project's supported backup/restore process.
7. **Review required:** complete a production migration diff, data-backfill impact review, RLS/service-role review, and rollback/recovery plan.
8. **Approval required:** obtain explicit production migration approval before applying any workspace migration.
9. **Post-approval:** run production smoke tests for auth, workspace creation/selection, invitations, membership, project access, persistence, and audit events.
10. **Separate product decision:** complete invitation email delivery after sender-domain verification and explicit email-provider approval.

## Current decision

**CI is green; production readiness is not complete. Do not merge PR #91 or apply migrations to production yet.** Keep PR #91 as a draft until the GitHub secret prerequisites and maintenance run are verified, Auth leaked-password protection is enabled, backup/restore and rollout plans are evidenced, and production migration approval is explicitly granted.

Email delivery remains a separate decision and is not silently assumed to use any provider.
