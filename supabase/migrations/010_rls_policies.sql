-- ==========================================
-- ROW LEVEL SECURITY
--
-- Access model (one story per user):
--   * A user can access a story if they are
--     the owner OR a member (story_members).
--   * Public shared stories are exposed ONLY
--     through the security definer RPCs in
--     011_share_rpc_functions.sql.
--
-- NOTE: every policy creation is GUARDED.
-- Some projects already carry hand-written
-- policies (e.g. applied via the dashboard).
-- We only add ours when no permissive policy
-- for the same table+command exists, so this
-- migration never duplicates access paths.
-- ==========================================

alter table public.profiles       enable row level security;
alter table public.stories        enable row level security;
alter table public.story_members  enable row level security;
alter table public.moments        enable row level security;
alter table public.invitations    enable row level security;
alter table public.ai_stories     enable row level security;
alter table public.shared_stories enable row level security;

-- ------------------------------------------
-- HELPER: is the user a member of a story?
-- ------------------------------------------

create or replace function public.is_story_member(p_story_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.story_members m
        where m.story_id = p_story_id
          and m.user_id = auth.uid()
    );
$$;

-- ==========================================
-- PROFILES
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "profiles_select_own" on public.profiles
            for select using (auth.uid() = id);
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "profiles_update_own" on public.profiles
            for update using (auth.uid() = id);
    end if;
end
$$;

-- ==========================================
-- STORIES
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'stories'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "stories_select_members" on public.stories
            for select using (public.is_story_member(id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'stories'
      and cmd = 'INSERT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "stories_insert_owner" on public.stories
            for insert with check (auth.uid() = owner_id);
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'stories'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "stories_update_members" on public.stories
            for update using (public.is_story_member(id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'stories'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "stories_delete_owner" on public.stories
            for delete using (
                auth.uid() = owner_id
                or public.is_story_member(id)
            );
    end if;
end
$$;

-- ==========================================
-- STORY MEMBERS
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'story_members'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "story_members_select" on public.story_members
            for select using (
                user_id = auth.uid()
                or public.is_story_member(story_id)
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'story_members'
      and cmd = 'INSERT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "story_members_insert" on public.story_members
            for insert with check (
                auth.uid() = user_id
                and public.is_story_member(story_id)
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'story_members'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "story_members_delete" on public.story_members
            for delete using (
                user_id = auth.uid()
                or exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;
end
$$;

-- ==========================================
-- MOMENTS
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_select_members" on public.moments
            for select using (public.is_story_member(story_id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'INSERT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_insert_members" on public.moments
            for insert with check (
                public.is_story_member(story_id)
                and auth.uid() = created_by
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_update_members" on public.moments
            for update using (public.is_story_member(story_id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_delete_members" on public.moments
            for delete using (public.is_story_member(story_id));
    end if;
end
$$;

-- ==========================================
-- INVITATIONS
-- Owners manage invitations for their
-- stories. Invited users can read and act
-- on invitations addressed to their email.
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'invitations'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "invitations_select" on public.invitations
            for select using (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
                or (
                    auth.uid() is not null
                    and email = (
                        select email from auth.users
                        where id = auth.uid()
                    )
                )
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'invitations'
      and cmd = 'INSERT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "invitations_insert_owner" on public.invitations
            for insert with check (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'invitations'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "invitations_update" on public.invitations
            for update using (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
                or (
                    auth.uid() is not null
                    and email = (
                        select email from auth.users
                        where id = auth.uid()
                    )
                )
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'invitations'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "invitations_delete_owner" on public.invitations
            for delete using (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;
end
$$;

-- ==========================================
-- AI STORIES
-- Story members manage their own AI stories.
-- The edge function uses the service role
-- key, which bypasses RLS.
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'ai_stories'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "ai_stories_select_members" on public.ai_stories
            for select using (public.is_story_member(story_id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'ai_stories'
      and cmd = 'INSERT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "ai_stories_insert_members" on public.ai_stories
            for insert with check (public.is_story_member(story_id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'ai_stories'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "ai_stories_update_members" on public.ai_stories
            for update using (public.is_story_member(story_id));
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'ai_stories'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "ai_stories_delete_members" on public.ai_stories
            for delete using (public.is_story_member(story_id));
    end if;
end
$$;

-- ==========================================
-- SHARED STORIES
-- Owner-managed CRUD; public reads only
-- through the RPCs in 011.
-- ==========================================

do $$
declare
    v_count int;
begin
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'shared_stories'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "shared_stories_select_owner" on public.shared_stories
            for select using (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'shared_stories'
      and cmd = 'INSERT'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "shared_stories_insert_owner" on public.shared_stories
            for insert with check (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'shared_stories'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "shared_stories_update_owner" on public.shared_stories
            for update using (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;

    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'shared_stories'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "shared_stories_delete_owner" on public.shared_stories
            for delete using (
                exists (
                    select 1 from public.stories s
                    where s.id = story_id
                      and s.owner_id = auth.uid()
                )
            );
    end if;
end
$$;
