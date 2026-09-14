-- ==========================================
-- SHARE PASSWORD PROTECTION (015)
--
-- Adds password protection + location
-- privacy to share links:
--   * shared_stories.password_hash stores a
--     salted bcrypt hash — NEVER plaintext.
--   * The legacy `password` text column is
--     dropped after migration (any existing
--     plaintext values are hashed first).
--   * shared_stories.include_locations lets
--     owners strip place names from the
--     public view (defaults to true).
--   * Both public RPCs take an optional
--     p_password; protected shares return
--     no rows without the correct password.
-- ==========================================

-- ==========================================
-- NOTE: on Supabase, pgcrypto lives in the
-- `extensions` schema — the RPCs below pin
-- their search_path to public + extensions.
-- ==========================================

create extension if not exists pgcrypto
  with schema extensions;

-- ------------------------------------------
-- 1. Add the hash + privacy columns
-- ------------------------------------------

alter table public.shared_stories
  add column if not exists password_hash text;

alter table public.shared_stories
  add column if not exists include_locations
    boolean not null default true;

-- ------------------------------------------
-- 2. Hash any existing plaintext passwords
--    (schema allowed a `password` column)
-- ------------------------------------------

do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'shared_stories'
          and column_name = 'password'
    ) then
        update public.shared_stories
        set password_hash = crypt(password, gen_salt('bf'))
        where password is not null
          and password <> '';

        alter table public.shared_stories
          drop column password;
    end if;
end
$$;

-- ------------------------------------------
-- 3. Password-aware RPCs
--    (replace 011 versions; same columns)
-- ------------------------------------------

create or replace function public.get_public_share(
    p_share_code text,
    p_password text default null
)
returns table (
    share_code  text,
    story_id    uuid,
    title       text,
    cover_photo text,
    created_at  timestamptz
)
language sql
security definer
set search_path = public, extensions
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
           or ss.expires_at > now())
      and (
        ss.password_hash is null
        or (p_password is not null
            and ss.password_hash = crypt(p_password, ss.password_hash))
      );
$$;

grant execute on function public.get_public_share(text, text)
    to anon, authenticated;

revoke execute on function public.get_public_share(text, text)
    from public;

create or replace function public.get_public_shared_story(
    p_share_code text,
    p_password text default null
)
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
set search_path = public, extensions
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
        -- Location privacy: strip place names
        -- when the owner disabled them.
        case
            when ss.include_locations then m.location
            else null
        end                    as location,
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
      and (
        ss.password_hash is null
        or (p_password is not null
            and ss.password_hash = crypt(p_password, ss.password_hash))
      )
    order by m.memory_date asc nulls last;
$$;

grant execute on function public.get_public_shared_story(text, text)
    to anon, authenticated;

revoke execute on function public.get_public_shared_story(text, text)
    from public;

-- ------------------------------------------
-- 4. Drop the legacy 1-argument overloads
--    (they bypassed the password check —
--    only the password-aware versions above
--    may remain)
-- ------------------------------------------

drop function if exists public.get_public_share(text);

drop function if exists public.get_public_shared_story(text);
