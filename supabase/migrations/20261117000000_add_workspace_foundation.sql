-- Phase 1 workspace, membership, invitation, and project-access foundation.
-- Existing authenticated projects are preserved by assigning each owner a
-- personal workspace before workspace_id is made part of their project scope.

create table if not exists public.workspaces (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  is_personal boolean not null default false,
  created_by uuid null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspaces_name_nonempty_check
    check (char_length(btrim(name)) > 0),
  constraint workspaces_creator_check
    check (created_by is not null or is_personal = false)
);

create unique index if not exists workspaces_personal_owner_unique_idx
  on public.workspaces (created_by)
  where is_personal = true and created_by is not null;

create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null,
  added_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id),
  constraint workspace_memberships_role_check
    check (role in ('owner', 'admin', 'member', 'viewer'))
);

create index if not exists workspace_memberships_user_idx
  on public.workspace_memberships (user_id, created_at desc);

create table if not exists public.workspace_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null,
  token_hash text not null unique,
  status text not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_invitations_email_check
    check (email = lower(btrim(email)) and char_length(email) > 3),
  constraint workspace_invitations_role_check
    check (role in ('admin', 'member', 'viewer')),
  constraint workspace_invitations_status_check
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  constraint workspace_invitations_lifecycle_check
    check (
      (status = 'accepted' and accepted_at is not null and revoked_at is null)
      or (status = 'revoked' and revoked_at is not null and accepted_at is null)
      or (status in ('pending', 'expired') and accepted_at is null and revoked_at is null)
    )
);

create index if not exists workspace_invitations_workspace_status_idx
  on public.workspace_invitations (workspace_id, status, created_at desc);

create table if not exists public.project_memberships (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null,
  granted_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id),
  constraint project_memberships_role_check
    check (role in ('project_admin', 'editor', 'viewer'))
);

create index if not exists project_memberships_user_idx
  on public.project_memberships (user_id, created_at desc);

alter table public.projects
  add column if not exists workspace_id uuid null
    references public.workspaces(id) on delete restrict;

alter table public.projects
  add column if not exists visibility text not null default 'private';

-- Preserve existing authenticated data and make every existing owner an
-- explicit owner of a personal workspace.
insert into public.workspaces (name, is_personal, created_by)
select 'Personal workspace', true, p.owner_id
from public.projects p
where p.owner_id is not null
  and p.anonymous_session_id is null
group by p.owner_id
on conflict (created_by) where is_personal = true and created_by is not null
do nothing;

insert into public.workspace_memberships (workspace_id, user_id, role, added_by)
select w.id, w.created_by, 'owner', w.created_by
from public.workspaces w
where w.is_personal = true
  and w.created_by is not null
on conflict (workspace_id, user_id) do nothing;

update public.projects p
set workspace_id = w.id
from public.workspaces w
where p.owner_id = w.created_by
  and p.owner_id is not null
  and p.anonymous_session_id is null
  and p.workspace_id is null;

insert into public.project_memberships (project_id, user_id, role, granted_by)
select p.id, p.owner_id, 'project_admin', p.owner_id
from public.projects p
where p.owner_id is not null
  and p.anonymous_session_id is null
  and p.workspace_id is not null
on conflict (project_id, user_id) do nothing;

alter table public.projects
  add constraint projects_visibility_check
  check (visibility in ('private', 'workspace'));

alter table public.projects
  add constraint projects_authenticated_workspace_check
  check (
    (owner_id is not null and anonymous_session_id is null and workspace_id is not null)
    or (owner_id is null and anonymous_session_id is not null and workspace_id is null)
  );

create index if not exists projects_workspace_updated_idx
  on public.projects (workspace_id, updated_at desc)
  where workspace_id is not null;

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.project_memberships enable row level security;

-- The application uses server-side authorization and a privileged repository
-- boundary. Direct browser table access remains closed until equivalent
-- user-scoped policies and grants are deliberately introduced.
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_memberships from anon, authenticated;
revoke all on table public.workspace_invitations from anon, authenticated;
revoke all on table public.project_memberships from anon, authenticated;
