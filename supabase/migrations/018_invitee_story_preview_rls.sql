-- ==========================================
-- INVITEE STORY PREVIEW (RLS)
--
-- Users holding a PENDING invitation for a story
-- can read its basic details (title) for the
-- acceptance page. The invitations.status guard
-- makes this transient: the row stops matching
-- the moment it is accepted or declined.
-- ==========================================

create policy "Invited users can preview invited stories"
    on public.stories
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.invitations i
            where i.story_id = stories.id
              and i.status = 'pending'
              and lower(i.email) = lower(
                    coalesce(
                        auth.jwt() ->> 'email', ''
                    )
                  )
        )
    );
