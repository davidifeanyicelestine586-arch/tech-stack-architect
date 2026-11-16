-- Expand the projects table for canonical V2 snapshots without rewriting
-- existing V1 rows. The application migrates V1 records on read and writes V2
-- on the next save, preserving a safe additive rollout path.

alter table public.projects
  add column if not exists architecture jsonb null,
  add column if not exists development_plan jsonb null;

alter table public.projects
  drop constraint if exists projects_schema_version_check;

alter table public.projects
  add constraint projects_schema_version_check
  check (schema_version in (1, 2));
