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
do $expiry$
declare
  expired_count integer;
begin
  expired_count := public.expire_workspace_invitations(now());
  if expired_count <> 1 then
    raise exception 'Expected one expired invitation to be materialized, received %', expired_count;
  end if;
end;
$expiry$;
reset role;

set local role service_role;
do $project_update$
declare
  project_snapshot jsonb;
begin
  select jsonb_build_object(
    'schema_version', schema_version,
    'name', name,
    'description', description,
    'domain_id', domain_id,
    'difficulty', difficulty,
    'requirements', requirements,
    'selected_component_ids', selected_component_ids,
    'active_recipe_id', active_recipe_id,
    'architecture', architecture,
    'development_plan', development_plan
  )
  into project_snapshot
  from public.projects
  where id = 'a0000000-0000-4000-8000-000000000001';

  perform * from public.update_workspace_project_with_audit(
    'a0000000-0000-4000-8000-000000000001',
    (select id from public.workspaces where created_by = '10000000-0000-4000-8000-000000000001' and is_personal = true),
    1,
    project_snapshot,
    'workspace',
    '10000000-0000-4000-8000-000000000001'
  );

  begin
    perform * from public.update_workspace_project_with_audit(
      'a0000000-0000-4000-8000-000000000001',
      (select id from public.workspaces where created_by = '10000000-0000-4000-8000-000000000001' and is_personal = true),
      2,
      project_snapshot,
      'private',
      '20000000-0000-4000-8000-000000000002'
    );
    raise exception 'Tenant B unexpectedly updated Tenant A project';
  exception when insufficient_privilege then
    null;
  end;

  if not exists (
    select 1 from public.projects
    where id = 'a0000000-0000-4000-8000-000000000001'
      and revision = 2
      and visibility = 'workspace'
  ) then
    raise exception 'Atomic project update did not persist expected revision and visibility';
  end if;
end;
$project_update$;
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
  if visible_count <> 3 then
    raise exception 'Tenant A expected three visible activity events, received %', visible_count;
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
