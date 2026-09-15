-- ==========================================
-- STORY MEMBER VISIBILITY (RLS)
--
-- The SELECT policy only admitted story
-- OWNERS, so editors/partners could never
-- see each other in member lists, member
-- avatars, or the birthday-reminder lookups.
-- Every member of a story may now see the
-- membership rows of that story.
-- ==========================================

drop policy if exists "Users can view members of their stories"
    on public.story_members;

create policy "Users can view members of their stories"
    on public.story_members
    for select
    to authenticated
    using (
        public.is_story_member(story_id)
    );
