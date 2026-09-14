-- ==========================================
-- SHARE MANAGEMENT RPCs (016)
--
-- Owner-side share link management:
--   * create_share_link() — server-side code
--     generation, optional bcrypt-hashed
--     password, optional expiry, optional
--     location privacy. Plaintext passwords
--     never touch the client.
--   * update_share_link() — toggle public,
--     set expiry, set/remove password.
--   * get_story_shares() — owners read
--     share state without touching the
--     shared_stories table directly
--     (its RLS is owner-only; this avoids
--     depending on direct-table grants).
--
-- NOTE: pgcrypto (gen_random_bytes, crypt,
-- gen_salt) lives in the `extensions` schema
-- on Supabase, so the functions below pin
-- search_path to public + extensions.
-- ==========================================

-- NOTE: the include_locations column itself
-- is created in 015 (password protection),
-- which must run before this migration.

-- ------------------------------------------
-- 1. Create a share link (owner only)
--    Returns the new row so the UI can show
--    the code immediately.
-- ------------------------------------------

create or replace function public.create_share_link(
    p_story_id uuid,
    p_password text default null,
    p_expires_at timestamptz default null,
    p_include_locations boolean default true
)
returns public.shared_stories
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_is_owner boolean;
    v_code     text;
    v_row      public.shared_stories;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated'
            using errcode = '42501';
    end if;

    select exists (
        select 1 from public.story_members
        where story_id = p_story_id
          and user_id = auth.uid()
          and role = 'owner'
    ) into v_is_owner;

    if not v_is_owner then
        raise exception 'Only the story owner can create share links'
            using errcode = '42501';
    end if;

    -- 128-bit random code, url-safe
    v_code := encode(gen_random_bytes(12), 'base64');
    v_code := replace(replace(v_code, '+', '-'), '/', '_');
    v_code := rtrim(v_code, '=');

    insert into public.shared_stories (
        story_id,
        share_code,
        is_public,
        expires_at,
        password_hash,
        include_locations
    ) values (
        p_story_id,
        v_code,
        true,
        p_expires_at,
        case
            when p_password is not null and p_password <> ''
            then crypt(p_password, gen_salt('bf'))
            else null
        end,
        coalesce(p_include_locations, true)
    )
    returning * into v_row;

    return v_row;
end;
$$;

-- ------------------------------------------
-- 2. Update a share link (owner only)
--    Pass NULL password to remove protection,
--    p_password text to set one.
-- ------------------------------------------

create or replace function public.update_share_link(
    p_share_id uuid,
    p_is_public boolean default null,
    p_expires_at timestamptz default null,
    p_password text default null,
    p_clear_password boolean default false,
    p_include_locations boolean default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_story_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated'
            using errcode = '42501';
    end if;

    select story_id into v_story_id
    from public.shared_stories
    where id = p_share_id;

    if v_story_id is null then
        raise exception 'Share not found'
            using errcode = 'P0002';
    end if;

    if not exists (
        select 1 from public.story_members
        where story_id = v_story_id
          and user_id = auth.uid()
          and role = 'owner'
    ) then
        raise exception 'Only the story owner can manage share links'
            using errcode = '42501';
    end if;

    update public.shared_stories
    set
        is_public   = coalesce(p_is_public, is_public),
        expires_at  = coalesce(p_expires_at, expires_at),
        include_locations = coalesce(p_include_locations, include_locations),
        password_hash = case
            when p_clear_password then null
            when p_password is not null and p_password <> ''
            then crypt(p_password, gen_salt('bf'))
            else password_hash
        end
    where id = p_share_id;
end;
$$;

-- ------------------------------------------
-- 3. Owner share listing
--    No password hashes, no plaintext.
-- ------------------------------------------

create or replace function public.get_story_shares(
    p_story_id uuid
)
returns table (
    id          uuid,
    share_code  text,
    is_public   boolean,
    created_at  timestamptz,
    expires_at  timestamptz,
    is_protected boolean,
    include_locations boolean
)
language sql
security definer
set search_path = public, extensions
as $$
    select
        ss.id,
        ss.share_code,
        ss.is_public,
        ss.created_at,
        ss.expires_at,
        (ss.password_hash is not null) as is_protected,
        ss.include_locations
    from public.shared_stories ss
    where ss.story_id = p_story_id
      and exists (
        select 1 from public.story_members
        where story_id = p_story_id
          and user_id = auth.uid()
          and role = 'owner'
      )
    order by ss.created_at desc;
$$;

grant execute on function public.create_share_link(uuid, text, timestamptz, boolean)
    to authenticated;
grant execute on function public.update_share_link(uuid, boolean, timestamptz, text, boolean, boolean)
    to authenticated;
grant execute on function public.get_story_shares(uuid)
    to authenticated;

revoke execute on function public.create_share_link(uuid, text, timestamptz, boolean)
    from public, anon;
revoke execute on function public.update_share_link(uuid, boolean, timestamptz, text, boolean, boolean)
    from public, anon;
revoke execute on function public.get_story_shares(uuid)
    from public, anon;
