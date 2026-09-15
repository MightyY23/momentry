-- ==========================================
-- PARTNER INVITATION ACCEPTANCE FIX (017)
--
-- story_members_insert required
-- is_story_member(story_id) — impossible for
-- a first-time accepter (no membership yet).
-- Acceptance always failed at RLS.
--
-- The policy now also admits users who hold
-- a PENDING invitation for that story,
-- addressed to their own email.
-- ==========================================

drop policy if exists "story_members_insert" on public.story_members;

create policy "story_members_insert" on public.story_members
    for insert with check (
        auth.uid() = user_id
        and (
            public.is_story_member(story_id)
            or exists (
                select 1
                from public.invitations i
                where i.story_id = story_members.story_id
                  and i.status = 'pending'
                  and lower(i.email) = lower(
                        (select email from auth.users
                         where id = auth.uid())
                  )
            )
        )
    );
