-- Replace the legacy owner-only policies with workspace-aware, fail-closed
-- read policies. All mutations continue through authenticated server services.

create or replace function public.current_user_has_workspace_role(
  p_workspace_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and (p_roles is null or wm.role = any(p_roles))
  );
$$;

create or replace function public.current_user_can_access_project(
  p_project_id uuid,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_visibility text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null and (
    (
      p_workspace_id is null
      and p_owner_id = auth.uid()
    )
    or
    (
      p_workspace_id is not null
      and public.current_user_has_workspace_role(p_workspace_id)
      and (
        p_owner_id = auth.uid()
        or public.current_user_has_workspace_role(p_workspace_id, array['owner', 'admin'])
        or p_visibility = 'workspace'
        or exists (
          select 1
          from public.project_memberships pm
          where pm.project_id = p_project_id
            and pm.user_id = auth.uid()
        )
      )
    )
  );
$$;

revoke all on function public.current_user_has_workspace_role(uuid, text[]) from public, anon;
revoke all on function public.current_user_can_access_project(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.current_user_has_workspace_role(uuid, text[]) to authenticated, service_role;
grant execute on function public.current_user_can_access_project(uuid, uuid, uuid, text) to authenticated, service_role;

drop policy if exists "authenticated users can read own projects" on public.projects;
drop policy if exists "authenticated users can create own projects" on public.projects;
drop policy if exists "authenticated users can update own projects" on public.projects;
drop policy if exists "authenticated users can delete own projects" on public.projects;

create policy "workspace members can read authorised projects"
on public.projects
for select
to authenticated
using (
  public.current_user_can_access_project(id, workspace_id, owner_id, visibility)
);

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.project_memberships enable row level security;
alter table public.workspace_activity_events enable row level security;
alter table public.projects enable row level security;

drop policy if exists "workspace members can read their workspaces" on public.workspaces;
create policy "workspace members can read their workspaces"
on public.workspaces
for select
to authenticated
using (public.current_user_has_workspace_role(id));

drop policy if exists "workspace members can read workspace memberships" on public.workspace_memberships;
create policy "workspace members can read workspace memberships"
on public.workspace_memberships
for select
to authenticated
using (public.current_user_has_workspace_role(workspace_id));

drop policy if exists "workspace admins can read invitations" on public.workspace_invitations;
create policy "workspace admins can read invitations"
on public.workspace_invitations
for select
to authenticated
using (public.current_user_has_workspace_role(workspace_id, array['owner', 'admin']));

drop policy if exists "authorised workspace members can read project memberships" on public.project_memberships;
create policy "authorised workspace members can read project memberships"
on public.project_memberships
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.current_user_can_access_project(p.id, p.workspace_id, p.owner_id, p.visibility)
  )
);

drop policy if exists "workspace members can read workspace activity" on public.workspace_activity_events;
create policy "workspace members can read workspace activity"
on public.workspace_activity_events
for select
to authenticated
using (public.current_user_has_workspace_role(workspace_id));

-- Browser clients may read only rows allowed by the policies above. All writes
-- remain on the authenticated server/service-role path.
revoke all on public.workspaces from anon, authenticated;
revoke all on public.workspace_memberships from anon, authenticated;
revoke all on public.workspace_invitations from anon, authenticated;
revoke all on public.project_memberships from anon, authenticated;
revoke all on public.workspace_activity_events from anon, authenticated;
revoke all on public.projects from anon, authenticated;

grant select on public.workspaces to authenticated;
grant select on public.workspace_memberships to authenticated;
grant select on public.workspace_invitations to authenticated;
grant select on public.project_memberships to authenticated;
grant select on public.workspace_activity_events to authenticated;
grant select on public.projects to authenticated;
