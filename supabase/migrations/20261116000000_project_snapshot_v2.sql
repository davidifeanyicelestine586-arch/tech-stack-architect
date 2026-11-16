-- Upgrade canonical project snapshots from V1 to V2.
-- Existing stack decisions remain intact; architecture and planning are empty
-- until the user generates and approves those artifacts.

alter table public.projects
  add column if not exists architecture jsonb null,
  add column if not exists development_plan jsonb null;

alter table public.projects
  drop constraint if exists projects_schema_version_check;

update public.projects
set
  architecture = null,
  development_plan = null,
  schema_version = 2
where schema_version = 1;

alter table public.projects
  add constraint projects_schema_version_check
  check (schema_version = 2);
