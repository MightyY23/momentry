-- ==========================================
-- SHARED STORIES
-- Public share links for a Story.
--
-- NOTE: no client-facing SELECT/INSERT/UPDATE
-- policies are created for this table on
-- purpose (see 010_rls_policies.sql). All
-- public reads must go through the
-- security definer RPCs in
-- 011_share_rpc_functions.sql.
-- ==========================================

create table if not exists public.shared_stories (
    id uuid primary key default gen_random_uuid(),

    story_id uuid not null
        references public.stories(id)
        on delete cascade,

    share_code text not null,

    is_public boolean not null default true,

    -- Reserved for future use (PRD: password
    -- protection + expiration dates).
    password text,
    expires_at timestamptz,

    created_at timestamptz default now(),

    unique (share_code)
);

create index if not exists shared_stories_story_id_idx
    on public.shared_stories (story_id);
