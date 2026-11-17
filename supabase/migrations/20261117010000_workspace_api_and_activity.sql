-- Workspace API foundation: atomic personal/team workspace creation and audit events.
-- All workspace mutations are performed by authenticated server services.
-- The service-role RPC is not callable by browser roles.

create table if not exists public.workspace_activity_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  subject_type text not null,
  subject_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workspace_activity_action_check
    check (action in (
      'workspace.created',
      'workspace.updated',
      'workspace.member_added',
      'workspace.member_role_changed',
      'workspace.member_removed',
      'workspace.invitation_created',
      'workspace.invitation_revoked',
      'project.visibility_changed',
      'project.admin_reassigned'
    )),
  constraint workspace_activity_subject_check
    check (subject_type in ('workspace', 'member', 'invitation', 'project'))
);

create index if not exists workspace_activity_events_recent_idx
  on public.workspace_activity_events (workspace_id, created_at desc);

alter table public.workspace_activity_events enable row level security;
revoke all on table public.workspace_activity_events from anon, authenticated;

create or replace function public.create_workspace_for_user(
  p_name text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_workspace_id uuid;
  normalized_name text;
begin
  normalized_name := btrim(p_name);

  if p_user_id is null then
    raise exception 'A workspace owner is required' using errcode = '22023';
  end if;

  if normalized_name is null or char_length(normalized_name) < 2 or char_length(normalized_name) > 80 then
    raise exception 'Workspace name must contain 2 to 80 characters' using errcode = '22023';
  end if;

  insert into public.workspaces (name, is_personal, created_by)
  values (normalized_name, false, p_user_id)
  returning id into new_workspace_id;

  insert into public.workspace_memberships (workspace_id, user_id, role, added_by)
  values (new_workspace_id, p_user_id, 'owner', p_user_id);

  insert into public.workspace_activity_events (
    workspace_id, actor_id, action, subject_type, subject_id, metadata
  )
  values (
    new_workspace_id, p_user_id, 'workspace.created', 'workspace', new_workspace_id,
    jsonb_build_object('name', normalized_name)
  );

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace_for_user(text, uuid) from public, anon, authenticated;
grant execute on function public.create_workspace_for_user(text, uuid) to service_role;
