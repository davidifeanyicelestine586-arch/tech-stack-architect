-- Keep SECURITY DEFINER helpers in a non-exposed schema. All mutation RPCs
-- are SECURITY INVOKER and are callable only by the server's service_role.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_user_has_workspace_role(
  p_workspace_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.workspace_memberships wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and w.status = 'active'
      and (p_roles is null or wm.role = any(p_roles))
  );
$$;

create or replace function private.current_user_can_access_project(
  p_project_id uuid,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_visibility text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private, pg_temp
as $$
  select auth.uid() is not null and (
    (
      p_workspace_id is null
      and p_owner_id = auth.uid()
    )
    or
    (
      p_workspace_id is not null
      and private.current_user_has_workspace_role(p_workspace_id)
      and (
        private.current_user_has_workspace_role(p_workspace_id, array['owner', 'admin'])
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

revoke all on function private.current_user_has_workspace_role(uuid, text[]) from public, anon;
revoke all on function private.current_user_can_access_project(uuid, uuid, uuid, text) from public, anon;
grant execute on function private.current_user_has_workspace_role(uuid, text[]) to authenticated, service_role;
grant execute on function private.current_user_can_access_project(uuid, uuid, uuid, text) to authenticated, service_role;

drop policy if exists "workspace members can read authorised projects" on public.projects;
create policy "workspace members can read authorised projects"
on public.projects
for select
to authenticated
using (
  private.current_user_can_access_project(id, workspace_id, owner_id, visibility)
);

drop policy if exists "workspace members can read their workspaces" on public.workspaces;
create policy "workspace members can read their workspaces"
on public.workspaces
for select
to authenticated
using (private.current_user_has_workspace_role(id));

drop policy if exists "workspace members can read workspace memberships" on public.workspace_memberships;
create policy "workspace members can read workspace memberships"
on public.workspace_memberships
for select
to authenticated
using (private.current_user_has_workspace_role(workspace_id));

drop policy if exists "workspace admins can read invitations" on public.workspace_invitations;
create policy "workspace admins can read invitations"
on public.workspace_invitations
for select
to authenticated
using (private.current_user_has_workspace_role(workspace_id, array['owner', 'admin']));

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
      and private.current_user_can_access_project(p.id, p.workspace_id, p.owner_id, p.visibility)
  )
);

drop policy if exists "workspace members can read workspace activity" on public.workspace_activity_events;
create policy "workspace members can read workspace activity"
on public.workspace_activity_events
for select
to authenticated
using (private.current_user_has_workspace_role(workspace_id));

drop policy if exists "requesters and workspace admins can read access requests" on public.workspace_access_requests;
create policy "requesters and workspace admins can read access requests"
on public.workspace_access_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or private.current_user_has_workspace_role(workspace_id, array['owner', 'admin'])
);

drop function if exists public.current_user_can_access_project(uuid, uuid, uuid, text);
drop function if exists public.current_user_has_workspace_role(uuid, text[]);

-- The signup trigger is also moved out of the API-exposed public schema.
create or replace function private.create_personal_workspace_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  personal_workspace_id uuid;
begin
  insert into public.workspaces (name, is_personal, created_by)
  values ('Personal workspace', true, new.id)
  on conflict (created_by) where is_personal = true and created_by is not null
  do nothing
  returning id into personal_workspace_id;

  if personal_workspace_id is null then
    select id into personal_workspace_id
    from public.workspaces
    where created_by = new.id and is_personal = true;
  else
    insert into public.workspace_activity_events (
      workspace_id, actor_id, action, subject_type, subject_id, metadata
    )
    values (
      personal_workspace_id, new.id, 'workspace.created', 'workspace', personal_workspace_id,
      jsonb_build_object('personal', true)
    );
  end if;

  insert into public.workspace_memberships (workspace_id, user_id, role, added_by)
  values (personal_workspace_id, new.id, 'owner', new.id)
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_personal_workspace_for_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_create_personal_workspace on auth.users;
create trigger on_auth_user_created_create_personal_workspace
after insert on auth.users
for each row execute function private.create_personal_workspace_for_new_user();

drop function if exists public.create_personal_workspace_for_new_user();
