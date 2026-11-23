-- Cross-tenant integration checks for the workspace/project RLS migrations.
-- Executed against an isolated PostgreSQL instance with Supabase-compatible auth.uid().

begin;

insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'tenant-a@example.test'),
  ('20000000-0000-4000-8000-000000000002', 'tenant-b@example.test');

insert into public.projects (
  id, owner_id, workspace_id, visibility, name, description, domain_id, difficulty, updated_at
)
select
  'a0000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000001'::uuid,
  workspace.id,
  'private',
  'Tenant A project',
  'Tenant A isolated project',
  'web',
  'Beginner',
  now()
from public.workspaces workspace
where workspace.created_by = '10000000-0000-4000-8000-000000000001'
  and workspace.is_personal = true
union all
select
  'b0000000-0000-4000-8000-000000000002'::uuid,
  '20000000-0000-4000-8000-000000000002'::uuid,
  workspace.id,
  'private',
  'Tenant B project',
  'Tenant B isolated project',
  'web',
  'Beginner',
  now()
from public.workspaces workspace
where workspace.created_by = '20000000-0000-4000-8000-000000000002'
  and workspace.is_personal = true;

insert into public.workspace_invitations (
  workspace_id, email, role, token_hash, status, invited_by, expires_at
)
select
  workspace.id,
  'expired@example.test',
  'member',
  repeat('a', 64),
  'pending',
  workspace.created_by,
  now() - interval '1 day'
from public.workspaces workspace
where workspace.created_by = '10000000-0000-4000-8000-000000000001'
  and workspace.is_personal = true;

set local role service_role;
do $
declare
  expired_count integer;
begin
  expired_count := public.expire_workspace_invitations(now());
  if expired_count <> 1 then
    raise exception 'Expected one expired invitation to be materialized, received %', expired_count;
  end if;
end;
$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.workspaces;
  if visible_count <> 1 then
    raise exception 'Tenant A expected exactly one workspace, received %', visible_count;
  end if;

  select count(*) into visible_count from public.workspaces
  where created_by = '20000000-0000-4000-8000-000000000002';
  if visible_count <> 0 then
    raise exception 'Tenant A can read Tenant B workspace';
  end if;

  select count(*) into visible_count from public.workspace_memberships;
  if visible_count <> 1 then
    raise exception 'Tenant A expected exactly one visible membership, received %', visible_count;
  end if;

  select count(*) into visible_count from public.projects;
  if visible_count <> 1 then
    raise exception 'Tenant A expected exactly one visible project, received %', visible_count;
  end if;

  select count(*) into visible_count from public.projects
  where id = 'b0000000-0000-4000-8000-000000000002';
  if visible_count <> 0 then
    raise exception 'Tenant A can read Tenant B project';
  end if;

  select count(*) into visible_count from public.workspace_activity_events;
  if visible_count <> 2 then
    raise exception 'Tenant A expected two visible activity events, received %', visible_count;
  end if;

  select count(*) into visible_count from public.workspace_invitations
  where status = 'expired';
  if visible_count <> 1 then
    raise exception 'Tenant A expected one persisted expired invitation, received %', visible_count;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.workspaces;
  if visible_count <> 1 then
    raise exception 'Tenant B expected exactly one workspace, received %', visible_count;
  end if;

  select count(*) into visible_count from public.workspaces
  where created_by = '10000000-0000-4000-8000-000000000001';
  if visible_count <> 0 then
    raise exception 'Tenant B can read Tenant A workspace';
  end if;

  select count(*) into visible_count from public.workspace_memberships;
  if visible_count <> 1 then
    raise exception 'Tenant B expected exactly one visible membership, received %', visible_count;
  end if;

  select count(*) into visible_count from public.projects;
  if visible_count <> 1 then
    raise exception 'Tenant B expected exactly one visible project, received %', visible_count;
  end if;

  select count(*) into visible_count from public.projects
  where id = 'a0000000-0000-4000-8000-000000000001';
  if visible_count <> 0 then
    raise exception 'Tenant B can read Tenant A project';
  end if;

  select count(*) into visible_count from public.workspace_activity_events;
  if visible_count <> 1 then
    raise exception 'Tenant B expected exactly one visible activity event, received %', visible_count;
  end if;
end;
$$;

reset role;
rollback;
