-- Cross-tenant integration checks for the workspace/project RLS migrations.
-- Executed against an isolated PostgreSQL instance with Supabase-compatible auth.uid().

begin;

insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'tenant-a@example.test'),
  ('20000000-0000-4000-8000-000000000002', 'tenant-b@example.test');

insert into public.workspaces (id, name, is_personal, created_by) values
  ('a1000000-0000-4000-8000-000000000001', 'Tenant A Personal', true, '10000000-0000-4000-8000-000000000001'),
  ('b2000000-0000-4000-8000-000000000002', 'Tenant B Personal', true, '20000000-0000-4000-8000-000000000002');

insert into public.workspace_memberships (workspace_id, user_id, role, added_by) values
  ('a1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner', '10000000-0000-4000-8000-000000000001'),
  ('b2000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'owner', '20000000-0000-4000-8000-000000000002');

insert into public.workspace_activity_events (
  workspace_id, actor_id, action, subject_type, subject_id, metadata
) values
  ('a1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'workspace.created', 'workspace', 'a1000000-0000-4000-8000-000000000001', '{}'::jsonb),
  ('b2000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'workspace.created', 'workspace', 'b2000000-0000-4000-8000-000000000002', '{}'::jsonb);

insert into public.projects (
  id, owner_id, workspace_id, visibility, name, description, domain_id, difficulty, updated_at
) values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'private', 'Tenant A project', 'Tenant A isolated project', 'web', 'Beginner', now()),
  ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', 'private', 'Tenant B project', 'Tenant B isolated project', 'web', 'Beginner', now());

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
  if visible_count <> 1 then
    raise exception 'Tenant A expected exactly one visible activity event, received %', visible_count;
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
