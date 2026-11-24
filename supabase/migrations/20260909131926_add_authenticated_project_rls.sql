-- Defense-in-depth for authenticated project access.
-- Application persistence still resolves ownership server-side and uses the
-- privileged server client; these policies protect the table if a user-scoped
-- Supabase client is ever introduced.

create policy "authenticated users can read own projects"
on public.projects
for select
to authenticated
using (owner_id = auth.uid() and anonymous_session_id is null);

create policy "authenticated users can create own projects"
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid() and anonymous_session_id is null);

create policy "authenticated users can update own projects"
on public.projects
for update
to authenticated
using (owner_id = auth.uid() and anonymous_session_id is null)
with check (owner_id = auth.uid() and anonymous_session_id is null);

create policy "authenticated users can delete own projects"
on public.projects
for delete
to authenticated
using (owner_id = auth.uid() and anonymous_session_id is null);
