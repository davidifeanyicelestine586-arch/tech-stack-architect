create extension if not exists pgcrypto with schema extensions;

create table if not exists public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid null references auth.users(id) on delete set null,
  anonymous_session_id uuid null,

  name text not null,
  description text not null,
  domain_id text not null,
  difficulty text not null,
  requirements text not null default '',
  selected_component_ids text[] not null default '{}'::text[],
  active_recipe_id text null,

  schema_version smallint not null default 1,
  revision bigint not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint projects_scope_check
    check (owner_id is not null or anonymous_session_id is not null),
  constraint projects_name_nonempty_check
    check (char_length(btrim(name)) > 0),
  constraint projects_description_nonempty_check
    check (char_length(btrim(description)) > 0),
  constraint projects_difficulty_check
    check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  constraint projects_schema_version_check
    check (schema_version = 1),
  constraint projects_revision_check
    check (revision >= 1)
);

create index if not exists projects_owner_updated_idx
  on public.projects (owner_id, updated_at desc);

create index if not exists projects_anonymous_session_updated_idx
  on public.projects (anonymous_session_id, updated_at desc);

create or replace function public.touch_project_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

 drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
before update on public.projects
for each row
execute function public.touch_project_updated_at();

alter table public.projects enable row level security;

-- Phase 3A.2 uses a server-side privileged client with explicit scope
-- predicates. Direct browser/database access is intentionally unavailable.
revoke all on table public.projects from anon, authenticated;

-- No broad anonymous policy is created. Authenticated-owner policies can be
-- added only with the future authentication phase and must use auth.uid().
