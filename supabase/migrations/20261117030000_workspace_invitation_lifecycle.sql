-- Atomic invitation creation, acceptance and revocation.
-- Raw invitation tokens never enter the database; only SHA-256 hashes are stored.

create or replace function public.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role text,
  p_token_hash text,
  p_invited_by uuid,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_invitation_id uuid;
  normalized_email text;
begin
  normalized_email := lower(btrim(p_email));

  if not exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id
      and user_id = p_invited_by
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  if normalized_email = '' or char_length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid invitation email is required' using errcode = '22023';
  end if;

  if p_role is null or p_role not in ('admin', 'member', 'viewer') then
    raise exception 'Invitation role is invalid' using errcode = '22023';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}    raise exception 'Invitation token hash is invalid' using errcode = '22023';
  end if;

  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then
    raise exception 'Invitation expiry is invalid' using errcode = '22023';
  end if;

  insert into public.workspace_invitations (
    workspace_id, email, role, token_hash, status, invited_by, expires_at
  )
  values (
    p_workspace_id, normalized_email, p_role, p_token_hash, 'pending', p_invited_by, p_expires_at
  )
  returning id into new_invitation_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_invited_by, 'workspace.invitation_created', 'invitation', new_invitation_id,
    jsonb_build_object('email', normalized_email, 'role', p_role)
  );

  return new_invitation_id;
end;
$$;

create or replace function public.accept_workspace_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns table (workspace_id uuid, role text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  invitation public.workspace_invitations%rowtype;
  accepted_role text;
begin
  if p_user_id is null or p_user_email is null or lower(btrim(p_user_email)) = '' then
    raise exception 'An authenticated user email is required' using errcode = '42501';
  end if;

  select * into invitation
  from public.workspace_invitations
  where token_hash = p_token_hash
  for update;

  if not found or invitation.status <> 'pending' then
    raise exception 'Invitation is invalid or no longer pending' using errcode = 'P0002';
  end if;

  if invitation.expires_at <= now() then
    raise exception 'Invitation has expired' using errcode = 'P0002';
  end if;

  if invitation.email <> lower(btrim(p_user_email)) then
    raise exception 'Invitation email does not match the signed-in account' using errcode = '42501';
  end if;

  update public.workspace_invitations
  set status = 'accepted', accepted_at = now(), updated_at = now()
  where id = invitation.id;

  insert into public.workspace_memberships (workspace_id, user_id, role, added_by)
  values (invitation.workspace_id, p_user_id, invitation.role, invitation.invited_by)
  on conflict (workspace_id, user_id) do update
  set role = case
    when public.workspace_memberships.role = 'owner' then 'owner'
    when public.workspace_memberships.role = 'admin' then 'admin'
    when public.workspace_memberships.role = 'member' and excluded.role = 'viewer' then 'member'
    else excluded.role
  end,
  updated_at = now()
  returning public.workspace_memberships.role into accepted_role;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    invitation.workspace_id, p_user_id, 'workspace.member_added', 'member', p_user_id,
    jsonb_build_object('role', invitation.role, 'source', 'invitation')
  );

  return query select invitation.workspace_id, accepted_role;
end;
$$;

create or replace function public.revoke_workspace_invitation(
  p_workspace_id uuid,
  p_invitation_id uuid,
  p_actor_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  invitation public.workspace_invitations%rowtype;
begin
  if not exists (
    select 1 from public.workspace_memberships
    where workspace_id = p_workspace_id
      and user_id = p_actor_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace administrator permission is required' using errcode = '42501';
  end if;

  select * into invitation
  from public.workspace_invitations
  where id = p_invitation_id and workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if invitation.status <> 'pending' then
    return false;
  end if;

  update public.workspace_invitations
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where id = p_invitation_id;

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    p_workspace_id, p_actor_id, 'workspace.invitation_revoked', 'invitation', p_invitation_id,
    jsonb_build_object('email', invitation.email)
  );

  return true;
end;
$$;

revoke all on function public.create_workspace_invitation(uuid, text, text, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.accept_workspace_invitation(text, uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_workspace_invitation(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_workspace_invitation(uuid, text, text, text, uuid, timestamptz) to service_role;
grant execute on function public.accept_workspace_invitation(text, uuid, text) to service_role;
grant execute on function public.revoke_workspace_invitation(uuid, uuid, uuid) to service_role;
