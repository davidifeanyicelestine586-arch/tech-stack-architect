-- Workspace lifecycle and discoverable access-request foundations.

alter table public.workspaces
  add column if not exists status text not null default 'active',
  add column if not exists archived_at timestamptz null,
  add column if not exists visibility text not null default 'private';

alter table public.workspaces
  drop constraint if exists workspaces_status_check,
  drop constraint if exists workspaces_visibility_check,
  drop constraint if exists workspaces_archive_check;

alter table public.workspaces
  add constraint workspaces_status_check
    check (status in ('active', 'archived')),
  add constraint workspaces_visibility_check
    check (visibility in ('private', 'discoverable')),
  add constraint workspaces_archive_check
    check ((status = 'active' and archived_at is null) or (status = 'archived' and archived_at is not null));

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
    join public.workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and w.status = 'active'
      and (p_roles is null or wm.role = any(p_roles))
  );
$$;

create unique index if not exists workspace_memberships_single_owner_unique_idx
  on public.workspace_memberships (workspace_id)
  where role = 'owner';

-- Ensure every existing and future authenticated account has a personal
-- workspace. The workspace is private and is not transferable.

insert into public.workspaces (name, is_personal, created_by)
select 'Personal workspace', true, u.id
from auth.users u
on conflict (created_by) where is_personal = true and created_by is not null
do nothing;

insert into public.workspace_memberships (workspace_id, user_id, role, added_by)
select w.id, w.created_by, 'owner', w.created_by
from public.workspaces w
where w.is_personal = true and w.created_by is not null
on conflict (workspace_id, user_id) do nothing;

create or replace function public.create_personal_workspace_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

revoke all on function public.create_personal_workspace_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_personal_workspace on auth.users;
create trigger on_auth_user_created_create_personal_workspace
after insert on auth.users
for each row execute function public.create_personal_workspace_for_new_user();

create table if not exists public.workspace_access_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  message text null,
  status text not null default 'pending',
  requested_role text not null default 'member',
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_access_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  constraint workspace_access_requests_role_check
    check (requested_role in ('member', 'viewer')),
  constraint workspace_access_requests_message_check
    check (message is null or char_length(message) <= 500),
  constraint workspace_access_requests_review_check
    check (
      (status = 'pending' and reviewed_at is null)
      or (status in ('approved', 'rejected') and reviewed_at is not null)
      or status in ('cancelled', 'expired')
    )
);

create unique index if not exists workspace_access_requests_pending_unique_idx
  on public.workspace_access_requests (workspace_id, requester_id)
  where status = 'pending';

create index if not exists workspace_access_requests_workspace_status_idx
  on public.workspace_access_requests (workspace_id, status, created_at desc);

create index if not exists workspaces_discoverable_active_idx
  on public.workspaces (created_at desc)
  where status = 'active' and visibility = 'discoverable';

alter table public.workspace_access_requests enable row level security;
revoke all on public.workspace_access_requests from anon, authenticated;
grant select on public.workspace_access_requests to authenticated;

drop policy if exists "requesters and workspace admins can read access requests" on public.workspace_access_requests;
create policy "requesters and workspace admins can read access requests"
on public.workspace_access_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or public.current_user_has_workspace_role(workspace_id, array['owner', 'admin'])
);

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
    'workspace.invitation_expired',
    'workspace.owner_transferred',
    'workspace.archived',
    'workspace.restored',
    'workspace.access_request_created',
    'workspace.access_request_approved',
    'workspace.access_request_rejected',
    'project.visibility_changed',
    'project.admin_reassigned',
    'project.member_added',
    'project.member_role_changed',
    'project.member_removed'
  ));

create or replace function public.rename_workspace(
  p_workspace_id uuid,
  p_name text,
  p_actor_id uuid
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_role text;
  normalized_name text;
begin
  select role into actor_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_actor_id;

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  normalized_name := btrim(p_name);
  if normalized_name is null or char_length(normalized_name) < 2 or char_length(normalized_name) > 80 then
    raise exception 'Workspace name must contain 2 to 80 characters' using errcode = '22023';
  end if;

  update public.workspaces
  set name = normalized_name, updated_at = now()
  where id = p_workspace_id and status = 'active';

  if not found then
    raise exception 'Active workspace not found' using errcode = 'P0002';
  end if;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.updated', 'workspace', p_workspace_id,
    jsonb_build_object('name', normalized_name)
  );

  return normalized_name;
end;
$$;

create or replace function public.transfer_workspace_ownership(
  p_workspace_id uuid,
  p_new_owner_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  workspace_record public.workspaces%rowtype;
begin
  select * into workspace_record
  from public.workspaces
  where id = p_workspace_id and status = 'active'
  for update;

  if not found then
    raise exception 'Active workspace not found' using errcode = 'P0002';
  end if;

  if workspace_record.is_personal then
    raise exception 'Personal workspace ownership cannot be transferred' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id and user_id = p_actor_id and role = 'owner'
  ) or p_new_owner_id = p_actor_id then
    raise exception 'Only the current owner can transfer ownership to another member' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id and user_id = p_new_owner_id
  ) then
    raise exception 'New owner must already be a workspace member' using errcode = '42501';
  end if;

  update public.workspace_memberships
  set role = 'admin', updated_at = now()
  where workspace_id = p_workspace_id and user_id = p_actor_id;

  update public.workspace_memberships
  set role = 'owner', updated_at = now()
  where workspace_id = p_workspace_id and user_id = p_new_owner_id;

  update public.workspaces
  set created_by = p_new_owner_id, updated_at = now()
  where id = p_workspace_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.owner_transferred', 'workspace', p_workspace_id,
    jsonb_build_object('previousOwner', p_actor_id, 'newOwner', p_new_owner_id)
  );

  return true;
end;
$$;

create or replace function public.archive_workspace(
  p_workspace_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id and user_id = p_actor_id and role = 'owner'
  ) then
    raise exception 'Only the workspace owner can archive this workspace' using errcode = '42501';
  end if;

  update public.workspaces
  set status = 'archived', archived_at = now(), updated_at = now()
  where id = p_workspace_id and status = 'active';

  if not found then
    raise exception 'Workspace is already archived or unavailable' using errcode = 'P0002';
  end if;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.archived', 'workspace', p_workspace_id, '{}'::jsonb
  );

  return true;
end;
$$;

create or replace function public.restore_workspace(
  p_workspace_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id and user_id = p_actor_id and role = 'owner'
  ) then
    raise exception 'Only the workspace owner can restore this workspace' using errcode = '42501';
  end if;

  update public.workspaces
  set status = 'active', archived_at = null, updated_at = now()
  where id = p_workspace_id and status = 'archived';

  if not found then
    raise exception 'Workspace is already active or unavailable' using errcode = 'P0002';
  end if;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.restored', 'workspace', p_workspace_id, '{}'::jsonb
  );

  return true;
end;
$$;

create or replace function public.set_workspace_visibility(
  p_workspace_id uuid,
  p_visibility text,
  p_actor_id uuid
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_role text;
begin
  select role into actor_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_actor_id;

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  if p_visibility is null or p_visibility not in ('private', 'discoverable') then
    raise exception 'Workspace visibility is invalid' using errcode = '22023';
  end if;
  if exists (select 1 from public.workspaces where id = p_workspace_id and is_personal = true)
    and p_visibility <> 'private' then
    raise exception 'Personal workspaces cannot be discoverable' using errcode = '42501';
  end if;

  update public.workspaces
  set visibility = p_visibility, updated_at = now()
  where id = p_workspace_id and status = 'active';

  if not found then
    raise exception 'Active workspace not found' using errcode = 'P0002';
  end if;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.updated', 'workspace', p_workspace_id,
    jsonb_build_object('visibility', p_visibility)
  );

  return p_visibility;
end;
$$;

create or replace function public.request_workspace_access(
  p_workspace_id uuid,
  p_requester_id uuid,
  p_message text,
  p_requested_role text default 'member'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  request_id uuid;
begin
  if not exists (
    select 1 from public.workspaces
    where id = p_workspace_id and status = 'active' and visibility = 'discoverable'
  ) then
    raise exception 'Workspace is not accepting access requests' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id and user_id = p_requester_id
  ) then
    raise exception 'User is already a workspace member' using errcode = '23505';
  end if;

  if p_requested_role is null or p_requested_role not in ('member', 'viewer') then
    raise exception 'Requested role is invalid' using errcode = '22023';
  end if;

  insert into public.workspace_access_requests (
    workspace_id, requester_id, message, requested_role, status
  )
  values (
    p_workspace_id, p_requester_id, nullif(btrim(p_message), ''), p_requested_role, 'pending'
  )
  returning id into request_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_requester_id, 'workspace.access_request_created', 'workspace', p_workspace_id,
    jsonb_build_object('requestId', request_id, 'requestedRole', p_requested_role)
  );

  return request_id;
end;
$$;

create or replace function public.review_workspace_access_request(
  p_workspace_id uuid,
  p_request_id uuid,
  p_actor_id uuid,
  p_decision text,
  p_role text default 'member'
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_role text;
  access_request public.workspace_access_requests%rowtype;
begin
  select role into actor_role
  from public.workspace_memberships
  where workspace_id = p_workspace_id and user_id = p_actor_id;

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.workspaces where id = p_workspace_id and status = 'active') then
    raise exception 'Workspace is not active' using errcode = 'P0002';
  end if;

  select * into access_request
  from public.workspace_access_requests
  where id = p_request_id and workspace_id = p_workspace_id
  for update;

  if not found or access_request.status <> 'pending' then
    raise exception 'Pending access request not found' using errcode = 'P0002';
  end if;

  if p_decision is null or p_decision not in ('approve', 'reject') then
    raise exception 'Access request decision is invalid' using errcode = '22023';
  end if;

  if p_decision = 'approve' then
    if p_role is null or p_role not in ('member', 'viewer') then
      raise exception 'Approved access role is invalid' using errcode = '22023';
    end if;

    update public.workspace_access_requests
    set status = 'approved', requested_role = p_role, reviewed_by = p_actor_id, reviewed_at = now(), updated_at = now()
    where id = p_request_id;

    insert into public.workspace_memberships (workspace_id, user_id, role, added_by)
    values (p_workspace_id, access_request.requester_id, p_role, p_actor_id)
    on conflict (workspace_id, user_id) do nothing;

    insert into public.workspace_activity_events (
      workspace_id, actor_id, action, subject_type, subject_id, metadata
    )
    values (
      p_workspace_id, p_actor_id, 'workspace.access_request_approved', 'member', access_request.requester_id,
      jsonb_build_object('requestId', p_request_id, 'role', p_role)
    );

    return p_role;
  end if;

  update public.workspace_access_requests
  set status = 'rejected', reviewed_by = p_actor_id, reviewed_at = now(), updated_at = now()
  where id = p_request_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.access_request_rejected', 'member', access_request.requester_id,
    jsonb_build_object('requestId', p_request_id)
  );

  return 'rejected';
end;
$$;

revoke all on function public.rename_workspace(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.transfer_workspace_ownership(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.archive_workspace(uuid, uuid) from public, anon, authenticated;
revoke all on function public.restore_workspace(uuid, uuid) from public, anon, authenticated;
revoke all on function public.set_workspace_visibility(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.request_workspace_access(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.review_workspace_access_request(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.rename_workspace(uuid, text, uuid) to service_role;
grant execute on function public.transfer_workspace_ownership(uuid, uuid, uuid) to service_role;
grant execute on function public.archive_workspace(uuid, uuid) to service_role;
grant execute on function public.restore_workspace(uuid, uuid) to service_role;
grant execute on function public.set_workspace_visibility(uuid, text, uuid) to service_role;
grant execute on function public.request_workspace_access(uuid, uuid, text, text) to service_role;
grant execute on function public.review_workspace_access_request(uuid, uuid, uuid, text, text) to service_role;


-- Materialize expired invitations so their persisted lifecycle state matches
-- the expiry timestamp, and record the transition in the workspace audit log.
create or replace function public.expire_workspace_invitations(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  expired_count integer;
begin
  if p_now is null then
    raise exception 'Expiry timestamp is required' using errcode = '22023';
  end if;

  with expired as (
    update public.workspace_invitations
    set status = 'expired', updated_at = p_now
    where status = 'pending'
      and expires_at <= p_now
    returning id, workspace_id, invited_by, email, role
  )
  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  select
    workspace_id,
    invited_by,
    'workspace.invitation_expired',
    'invitation',
    id,
    jsonb_build_object('email', email, 'role', role)
  from expired;

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function public.expire_workspace_invitations(timestamptz) from public, anon, authenticated;
grant execute on function public.expire_workspace_invitations(timestamptz) to service_role;

-- Update a workspace project and its visibility audit record in one transaction.
create or replace function public.update_workspace_project_with_audit(
  p_project_id uuid,
  p_workspace_id uuid,
  p_expected_revision bigint,
  p_snapshot jsonb,
  p_visibility text,
  p_actor_id uuid
)
returns setof public.projects
language plpgsql
security invoker
set search_path = public
as $project_update$
declare
  current_project public.projects%rowtype;
  snapshot_patch public.projects%rowtype;
  actor_workspace_role text;
  actor_project_role text;
  next_visibility text;
  previous_visibility text;
begin
  if p_project_id is null or p_workspace_id is null or p_actor_id is null or p_expected_revision is null or p_expected_revision < 1
    or p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Project update details are invalid' using errcode = '22023';
  end if;

  if not (p_snapshot ?& array[
    'schema_version', 'name', 'description', 'domain_id', 'difficulty',
    'requirements', 'selected_component_ids', 'active_recipe_id',
    'architecture', 'development_plan'
  ]) then
    raise exception 'Project snapshot is incomplete' using errcode = '22023';
  end if;

  select * into current_project
  from public.projects
  where id = p_project_id
  for update;

  if not found or current_project.workspace_id is null or current_project.workspace_id <> p_workspace_id then
    raise exception 'Workspace project not found' using errcode = 'P0002';
  end if;

  if current_project.revision <> p_expected_revision then
    raise exception 'Project revision changed before the update completed' using errcode = '40001';
  end if;

  if not exists (
    select 1 from public.workspaces
    where id = current_project.workspace_id and status = 'active'
  ) then
    raise exception 'Workspace project not found' using errcode = 'P0002';
  end if;

  select role into actor_workspace_role
  from public.workspace_memberships
  where workspace_id = current_project.workspace_id
    and user_id = p_actor_id;

  select role into actor_project_role
  from public.project_memberships
  where project_id = p_project_id
    and user_id = p_actor_id;

  if actor_workspace_role is null or not (
    actor_workspace_role in ('owner', 'admin')
    or (
      actor_workspace_role = 'member'
      and (
        coalesce(actor_project_role in ('project_admin', 'editor'), false)
        or (actor_project_role is distinct from 'viewer' and current_project.visibility = 'workspace')
      )
    )
  ) then
    raise exception 'Project write permission is required' using errcode = '42501';
  end if;

  if p_visibility is not null and p_visibility not in ('private', 'workspace') then
    raise exception 'Project visibility is invalid' using errcode = '22023';
  end if;

  previous_visibility := current_project.visibility;
  next_visibility := coalesce(p_visibility, current_project.visibility);
  if next_visibility is distinct from current_project.visibility
    and actor_workspace_role not in ('owner', 'admin')
    and actor_project_role is distinct from 'project_admin' then
    raise exception 'Only a Project Admin can change project visibility' using errcode = '42501';
  end if;

  select * into snapshot_patch
  from jsonb_populate_record(null::public.projects, p_snapshot);

  update public.projects
  set
    name = snapshot_patch.name,
    description = snapshot_patch.description,
    domain_id = snapshot_patch.domain_id,
    difficulty = snapshot_patch.difficulty,
    requirements = snapshot_patch.requirements,
    selected_component_ids = snapshot_patch.selected_component_ids,
    active_recipe_id = snapshot_patch.active_recipe_id,
    architecture = snapshot_patch.architecture,
    development_plan = snapshot_patch.development_plan,
    schema_version = snapshot_patch.schema_version,
    visibility = next_visibility,
    revision = current_project.revision + 1,
    updated_at = timezone('utc', now())
  where id = p_project_id
  returning * into current_project;

  if next_visibility is distinct from previous_visibility then
    insert into public.workspace_activity_events (
      workspace_id, actor_id, action, subject_type, subject_id, metadata
    )
    values (
      current_project.workspace_id,
      p_actor_id,
      'project.visibility_changed',
      'project',
      p_project_id,
      jsonb_build_object(
        'previousVisibility', previous_visibility,
        'newVisibility', next_visibility
      )
    );
  end if;

  return next current_project;
end;
$project_update$;

revoke all on function public.update_workspace_project_with_audit(uuid, uuid, bigint, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.update_workspace_project_with_audit(uuid, uuid, bigint, jsonb, text, uuid) to service_role;
