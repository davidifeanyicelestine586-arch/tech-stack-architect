-- Workspace membership administration. Ownership transfer is deliberately
-- separate; the last/current owner cannot be demoted or removed through these RPCs.

create or replace function public.update_workspace_member_role(
  p_workspace_id uuid,
  p_member_id uuid,
  p_new_role text,
  p_actor_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  member_role text;
begin
  select role into actor_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_actor_id;

  if actor_role not in ('owner', 'admin') then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  select role into member_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_member_id
  for update;

  if member_role is null then
    raise exception 'Workspace member not found' using errcode = 'P0002';
  end if;

  if member_role = 'owner' then
    raise exception 'Workspace ownership cannot be changed here' using errcode = '42501';
  end if;

  if actor_role = 'admin' and member_role = 'admin' then
    raise exception 'Only the workspace owner can change an admin role' using errcode = '42501';
  end if;

  if p_new_role is null or p_new_role not in ('admin', 'member', 'viewer') then
    raise exception 'Workspace role is invalid' using errcode = '22023';
  end if;

  update public.workspace_memberships
  set role = p_new_role, updated_at = now()
  where workspace_id = p_workspace_id and user_id = p_member_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.member_role_changed', 'member', p_member_id,
    jsonb_build_object('previousRole', member_role, 'newRole', p_new_role)
  );

  return p_new_role;
end;
$$;

create or replace function public.remove_workspace_member(
  p_workspace_id uuid,
  p_member_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  member_role text;
  project_record record;
begin
  select role into actor_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_actor_id;

  if actor_role not in ('owner', 'admin') then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  select role into member_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_member_id
  for update;

  if member_role is null then
    raise exception 'Workspace member not found' using errcode = 'P0002';
  end if;

  if member_role = 'owner' then
    raise exception 'The workspace owner cannot be removed' using errcode = '42501';
  end if;

  if actor_role = 'admin' and member_role = 'admin' then
    raise exception 'Only the workspace owner can remove an admin' using errcode = '42501';
  end if;

  -- Preserve administration for projects where this member was the sole
  -- Project Admin by assigning the acting workspace owner/admin first.
  for project_record in
    select pm.project_id
    from public.project_memberships pm
    join public.projects p on p.id = pm.project_id
    where p.workspace_id = p_workspace_id
      and pm.user_id = p_member_id
      and pm.role = 'project_admin'
      and not exists (
        select 1
        from public.project_memberships other_pm
        where other_pm.project_id = pm.project_id
          and other_pm.user_id <> p_member_id
          and other_pm.role = 'project_admin'
      )
  loop
    insert into public.project_memberships (project_id, user_id, role, granted_by)
    values (project_record.project_id, p_actor_id, 'project_admin', p_actor_id)
    on conflict (project_id, user_id) do update
      set role = 'project_admin', updated_at = now();

    insert into public.workspace_activity_events (
      workspace_id, actor_id, action, subject_type, subject_id, metadata
    )
    values (
      p_workspace_id, p_actor_id, 'project.admin_reassigned', 'project', project_record.project_id,
      jsonb_build_object('previousAdmin', p_member_id, 'newAdmin', p_actor_id)
    );
  end loop;

  delete from public.project_memberships pm
  using public.projects p
  where pm.project_id = p.id
    and p.workspace_id = p_workspace_id
    and pm.user_id = p_member_id;

  delete from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_member_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.member_removed', 'member', p_member_id,
    jsonb_build_object('previousRole', member_role)
  );

  return true;
end;
$$;

revoke all on function public.update_workspace_member_role(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.remove_workspace_member(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.update_workspace_member_role(uuid, uuid, text, uuid) to service_role;
grant execute on function public.remove_workspace_member(uuid, uuid, uuid) to service_role;
