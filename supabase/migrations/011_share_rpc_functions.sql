-- ==========================================
-- PUBLIC SHARE RPCs
--
-- security definer functions that expose
-- ONLY the intended data of public shares.
-- They never leak owner ids, emails,
-- passwords or revoked/expired shares.
--
-- Callers: anon + authenticated (anyone
-- with the share code) — this is what makes
-- public share links work while logged out.
--
-- NOTE: recreate_if the functions already
-- exist (they do on live projects), this
-- replaces them with the same signatures,
-- now reading the real is_favorite column.
-- ==========================================

-- ------------------------------------------
-- get_public_share
-- Share metadata + story header.
-- Used by services/share/getShare.js
-- ------------------------------------------

create or replace function public.get_public_share(p_share_code text)
returns table (
    share_code  text,
    story_id    uuid,
    title       text,
    cover_photo text,
    created_at  timestamptz
)
language sql
security definer
set search_path = public
as $$
    select
        ss.share_code,
        s.id       as story_id,
        s.title,
        s.cover_photo,
        s.created_at
    from public.shared_stories ss
    join public.stories s
        on s.id = ss.story_id
    where ss.share_code = p_share_code
      and ss.is_public = true
      and (ss.expires_at is null
           or ss.expires_at > now());
$$;

grant execute on function public.get_public_share(text)
    to anon, authenticated;

revoke execute on function public.get_public_share(text)
    from public;

-- ------------------------------------------
-- get_public_shared_story
-- One row per moment, story columns
-- repeated. Moments ordered by memory_date.
-- Uses the REAL moments.is_favorite column
-- (older versions selected a literal false).
-- Used by services/share/getPublicSharedStory.js
-- ------------------------------------------

create or replace function public.get_public_shared_story(p_share_code text)
returns table (
    story_id           uuid,
    story_title        text,
    cover_photo        text,
    moment_id          uuid,
    moment_title       text,
    moment_description text,
    memory_date        date,
    image_url          text,
    location           text,
    is_favorite        boolean
)
language sql
security definer
set search_path = public
as $$
    select
        s.id,
        s.title                as story_title,
        s.cover_photo,
        m.id                   as moment_id,
        m.title                as moment_title,
        m.description          as moment_description,
        m.memory_date,
        m.image_url,
        m.location,
        m.is_favorite
    from public.shared_stories ss
    join public.stories s
        on s.id = ss.story_id
    left join public.moments m
        on m.story_id = s.id
    where ss.share_code = p_share_code
      and ss.is_public = true
      and (ss.expires_at is null
           or ss.expires_at > now())
    order by m.memory_date asc nulls last;
$$;

grant execute on function public.get_public_shared_story(text)
    to anon, authenticated;

revoke execute on function public.get_public_shared_story(text)
    from public;
