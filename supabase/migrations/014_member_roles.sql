-- ==========================================
-- MEMBER ROLES & MANAGEMENT (014)
--
-- Roles: owner / editor / viewer
--   owner  -> full control incl. members
--   editor -> create/edit moments
--   viewer -> read-only
--
-- Legacy 'partner' rows are normalized to
-- 'editor' to keep existing stories working.
-- ==========================================

-- ------------------------------------------
-- 1. Drop the legacy role constraint FIRST,
--    then normalize legacy roles. (The old
--    check only allows owner/partner, so
--    updating to 'editor' must happen after
--    the constraint is gone.)
-- ------------------------------------------

alter table public.story_members
  drop constraint if exists story_members_role_check;

update public.story_members
set role = 'editor'
where role not in ('owner', 'editor', 'viewer');

-- ------------------------------------------
-- 2. Role constraint
-- ------------------------------------------

alter table public.story_members
  add constraint story_members_role_check
  check (role in ('owner', 'editor', 'viewer'));

-- ------------------------------------------
-- 3. Helpers (security definer, stable
--    search_path — safe for RLS use)
-- ------------------------------------------

create or replace function public.is_story_owner(p_story_id uuid)
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
          and m.role = 'owner'
    );
$$;

create or replace function public.is_story_editor(p_story_id uuid)
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
          and m.role in ('owner', 'editor')
    );
$$;

grant execute on function public.is_story_owner(uuid)
    to authenticated;
grant execute on function public.is_story_editor(uuid)
    to authenticated;

revoke execute on function public.is_story_owner(uuid)
    from public, anon;
revoke execute on function public.is_story_editor(uuid)
    from public, anon;

-- ------------------------------------------
-- 4. Member-management policies
--
-- story_members RLS already exists (010).
-- These ADD:
--   * owners manage members for their stories
--     (update role, remove member)
--   * everyone can still see members of
--     their own stories (010 select policy)
-- Insert stays: owner-only (via invite flow).
-- ------------------------------------------

do $$
declare
    v_count int;
begin
    -- UPDATE: owners change roles
    select count(*) into v_count from pg_policies
    where schemaname = 'public'
      and tablename = 'story_members'
      and cmd = 'UPDATE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "story_members_update_owner"
            on public.story_members
            for update
            using (public.is_story_owner(story_id))
            with check (
                public.is_story_owner(story_id)
                and user_id <> auth.uid()  -- owner cannot change own row (no self-demote)
            );
    end if;

    -- DELETE: owners remove members (not themselves)
    select count(*) into v_count from pg_policies
    where schemaname = 'public'
      and tablename = 'story_members'
      and cmd = 'DELETE'
      and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "story_members_delete_owner"
            on public.story_members
            for delete
            using (
                public.is_story_owner(story_id)
                and user_id <> auth.uid()  -- no self-removal; ownership transfer is out of scope
            );
    end if;
end
$$;

-- ------------------------------------------
-- 5. Moment write access becomes
--    role-aware: owners + editors can
--    create/update/delete moments.
--    Viewers are read-only.
--
--    NOTE: policies here are GUARDED like
--    010 — if the live project already has
--    permissive moment policies they are
--    left alone; run the follow-up SQL in
--    the migration report to tighten them.
-- ------------------------------------------

do $$
declare
    v_count int;
begin
    -- INSERT: editors+
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'INSERT' and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_insert_editors" on public.moments
            for insert with check (public.is_story_editor(story_id));
    end if;

    -- UPDATE: editors+
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'UPDATE' and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_update_editors" on public.moments
            for update using (public.is_story_editor(story_id));
    end if;

    -- DELETE: editors+
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'moments'
      and cmd = 'DELETE' and permissive = 'PERMISSIVE';

    if v_count = 0 then
        create policy "moments_delete_editors" on public.moments
            for delete using (public.is_story_editor(story_id));
    end if;
end
$$;
