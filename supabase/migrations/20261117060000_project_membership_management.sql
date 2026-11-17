-- Project-level access is scoped to a workspace and cannot create membership
-- outside that workspace. Project Admin is distinct from Workspace Admin.

alter table public.workspace_activity_events
  drop constraint if exists workspace_activity_action_check;

alter table public.workspace_activity_events
  add constraint workspace_activity_action_check
  check (action in (
    'workspace.created',
    'workspace.updated',
    'workspace.member_added',
    'workspace.member_role_changed',
    'workspace.member_removed',
    'workspace.invitation_created',
    'workspace.invitation_revoked',
    'project.visibility_changed',
    'project.admin_reassigned',
    'project.member_added',
    'project.member_role_changed',
    'project.member_removed'
  ));

create or replace function public.grant_project_member(
  p_project_id uuid,
  p_user_id uuid,
  p_role text,
  p_actor_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  project_workspace_id uuid;
  actor_workspace_role text;
  actor_project_role text;
  target_workspace_role text;
  previous_project_role text;
begin
  select workspace_id into project_workspace_id
  from public.projects
  where id = p_project_id;

  if project_workspace_id is null then
    raise exception 'Project does not belong to a workspace' using errcode = 'P0002';
  end if;

  select role into actor_workspace_role
  from public.workspace_memberships
  where workspace_id = project_workspace_id and user_id = p_actor_id;

  select role into actor_project_role
  from public.project_memberships
  where project_id = p_project_id and user_id = p_actor_id;

  if actor_workspace_role is null or (actor_workspace_role not in ('owner', 'admin')
    and not (actor_workspace_role = 'member' and actor_project_role = 'project_admin')) then
    raise exception 'Project administrator permission is required' using errcode = '42501';
  end if;

  select role into target_workspace_role
  from public.workspace_memberships
  where workspace_id = project_workspace_id and user_id = p_user_id;

  if target_workspace_role is null then
    raise exception 'Target user must already belong to the workspace' using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('project_admin', 'editor', 'viewer') then
    raise exception 'Project role is invalid' using errcode = '22023';
  end if;

  if target_workspace_role = 'viewer' and p_role <> 'viewer' then
    raise exception 'Workspace viewers cannot receive project write permissions' using errcode = '42501';
  end if;

  select role into previous_project_role
  from public.project_memberships
  where project_id = p_project_id and user_id = p_user_id;

  insert into public.project_memberships (project_id, user_id, role, granted_by)
  values (p_project_id, p_user_id, p_role, p_actor_id)
  on conflict (project_id, user_id) do update
    set role = excluded.role, granted_by = excluded.granted_by, updated_at = now();

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    project_workspace_id, p_actor_id,
    case when previous_project_role is null then 'project.member_added' else 'project.member_role_changed' end,
    'project', p_project_id,
    jsonb_build_object('memberId', p_user_id, 'previousRole', previous_project_role, 'newRole', p_role)
  );

  return p_role;
end;
$$;

create or replace function public.remove_project_member(
  p_project_id uuid,
  p_user_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  project_workspace_id uuid;
  actor_workspace_role text;
  actor_project_role text;
  target_project_role text;
begin
  select workspace_id into project_workspace_id
  from public.projects
  where id = p_project_id;

  if project_workspace_id is null then
    raise exception 'Project does not belong to a workspace' using errcode = 'P0002';
  end if;

  select role into actor_workspace_role
  from public.workspace_memberships
  where workspace_id = project_workspace_id and user_id = p_actor_id;

  select role into actor_project_role
  from public.project_memberships
  where project_id = p_project_id and user_id = p_actor_id;

  if actor_workspace_role not in ('owner', 'admin')
    and not (actor_workspace_role = 'member' and actor_project_role = 'project_admin') then
    raise exception 'Project administrator permission is required' using errcode = '42501';
  end if;

  select role into target_project_role
  from public.project_memberships
  where project_id = p_project_id and user_id = p_user_id
  for update;

  if target_project_role is null then
    raise exception 'Project member not found' using errcode = 'P0002';
  end if;

  if target_project_role = 'project_admin'
    and not exists (
      select 1 from public.project_memberships
      where project_id = p_project_id
        and user_id <> p_user_id
        and role = 'project_admin'
    ) then
    if actor_workspace_role in ('owner', 'admin') and p_actor_id <> p_user_id then
      insert into public.project_memberships (project_id, user_id, role, granted_by)
      values (p_project_id, p_actor_id, 'project_admin', p_actor_id)
      on conflict (project_id, user_id) do update
        set role = 'project_admin', updated_at = now();

      insert into public.workspace_activity_events (
        workspace_id, actor_id, action, subject_type, subject_id, metadata
      )
      values (
        project_workspace_id, p_actor_id, 'project.admin_reassigned', 'project', p_project_id,
        jsonb_build_object('previousAdmin', p_user_id, 'newAdmin', p_actor_id)
      );
    else
      raise exception 'Assign another Project Admin before removing the last one' using errcode = '42501';
    end if;
  end if;

  delete from public.project_memberships
  where project_id = p_project_id and user_id = p_user_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    project_workspace_id, p_actor_id, 'project.member_removed', 'project', p_project_id,
    jsonb_build_object('memberId', p_user_id, 'previousRole', target_project_role)
  );

  return true;
end;
$$;

revoke all on function public.grant_project_member(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.remove_project_member(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.grant_project_member(uuid, uuid, text, uuid) to service_role;
grant execute on function public.remove_project_member(uuid, uuid, uuid) to service_role;
