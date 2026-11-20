-- Ensure every authenticated project created inside a workspace grants
-- its creator explicit Project Admin access in the same database transaction.

create or replace function public.add_project_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workspace_id is not null and new.owner_id is not null then
    insert into public.project_memberships (project_id, user_id, role, granted_by)
    values (new.id, new.owner_id, 'project_admin', new.owner_id)
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_add_creator_membership on public.projects;
create trigger projects_add_creator_membership
after insert on public.projects
for each row
execute function public.add_project_creator_membership();

revoke all on function public.add_project_creator_membership() from public, anon, authenticated;
