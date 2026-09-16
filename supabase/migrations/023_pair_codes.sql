-- ==========================================
-- PARTNER CODE PAIRING
--
-- Email invitations depend on transactional
-- email delivery, which is unreliable here.
-- Partner codes replace it: either partner
-- shares a 6-character code and the other
-- enters it — no email involved.
--
-- Codes live on profiles, are 6 chars from
-- an unambiguous alphabet (no I/O/0/1),
-- expire after 7 days, and all pairing
-- rules are enforced SERVER-SIDE in these
-- security definer RPCs:
--   * get_or_create_pair_code()  — my code
--   * regenerate_pair_code()     — new code
--   * lookup_pair_code(code)     — safe preview
--   * pair_with_code(code)       — atomic join
-- ==========================================

alter table public.profiles
  add column if not exists pair_code text,
  add column if not exists pair_code_expires_at timestamptz;

create unique index if not exists profiles_pair_code_key
  on public.profiles (pair_code)
  where pair_code is not null;

-- ------------------------------------------
-- Code generator (definer: uniqueness check
-- must see all rows, not just RLS-visible)
-- ------------------------------------------
create or replace function public.generate_pair_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code     text;
  attempts int  := 0;
begin
  loop
    attempts := attempts + 1;
    code := '';
    for i in 1 .. 6 loop
      code := code || substr(
        alphabet,
        floor(random() * length(alphabet))::int + 1,
        1
      );
    end loop;
    exit when not exists (
      select 1 from public.profiles where pair_code = code
    ) or attempts > 20;
  end loop;

  if attempts > 20 then
    raise exception 'Could not generate a unique pair code, try again';
  end if;

  return code;
end;
$$;

-- ------------------------------------------
-- My current code (creates one if missing
-- or expired). Valid for 7 days.
-- ------------------------------------------
create or replace function public.get_or_create_pair_code()
returns table (pair_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.profiles;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select * into existing
  from public.profiles
  where id = uid;

  if existing.pair_code is not null
     and existing.pair_code_expires_at > now() then
    return query
      select existing.pair_code, existing.pair_code_expires_at;
    return;
  end if;

  update public.profiles
  set pair_code            = public.generate_pair_code(),
      pair_code_expires_at = now() + interval '7 days'
  where id = uid;

  return query
    select p.pair_code, p.pair_code_expires_at
    from public.profiles p
    where p.id = uid;
end;
$$;

-- ------------------------------------------
-- Force a fresh code (old one dead)
-- ------------------------------------------
create or replace function public.regenerate_pair_code()
returns table (pair_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  update public.profiles
  set pair_code            = public.generate_pair_code(),
      pair_code_expires_at = now() + interval '7 days'
  where id = uid;

  return query
    select p.pair_code, p.pair_code_expires_at
    from public.profiles p
    where p.id = uid;
end;
$$;

-- ------------------------------------------
-- Safe preview for a code — validates and
-- returns only name/avatar, never contact
-- data. Explains exactly why a pair would
-- fail before the user commits.
-- ------------------------------------------
create or replace function public.lookup_pair_code(p_code text)
returns table (
  full_name  text,
  avatar_url text,
  valid      boolean,
  reason     text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  rec record;
  target_story uuid;
  caller_story uuid;
  member_count int;
begin
  if caller is null then
    return query select null::text, null::text, false, 'Not signed in.';
    return;
  end if;

  select p.id, p.full_name, p.avatar_url,
         p.pair_code_expires_at
    into rec
  from public.profiles p
  where p.pair_code = upper(btrim(coalesce(p_code, '')));

  if rec.id is null then
    return query select null::text, null::text, false,
      'Code not found. Double-check and try again.';
    return;
  end if;

  if rec.id = caller then
    return query select null::text, null::text, false,
      'That''s your own code — share it with your partner.';
    return;
  end if;

  if rec.pair_code_expires_at <= now() then
    return query select null::text, null::text, false,
      'This code has expired. Ask your partner for a new one.';
    return;
  end if;

  select sm.story_id into caller_story
  from public.story_members sm
  where sm.user_id = caller
  limit 1;

  select sm.story_id into target_story
  from public.story_members sm
  where sm.user_id = rec.id
  limit 1;

  if caller_story is not null and caller_story = target_story then
    return query select null::text, null::text, false,
      'You''re already in a story together.';
    return;
  end if;

  if caller_story is not null and target_story is not null then
    return query select null::text, null::text, false,
      'You both have your own stories. One of you needs to leave their story first.';
    return;
  end if;

  if caller_story is not null then
    select count(*) into member_count
    from public.story_members where story_id = caller_story;
    if member_count >= 2 then
      return query select null::text, null::text, false,
        'Your story already has two members.';
      return;
    end if;
  end if;

  if target_story is not null then
    select count(*) into member_count
    from public.story_members where story_id = target_story;
    if member_count >= 2 then
      return query select null::text, null::text, false,
        'Their story already has two members.';
      return;
    end if;
  end if;

  return query select rec.full_name, rec.avatar_url, true, null::text;
end;
$$;

-- ------------------------------------------
-- The pair itself — atomic, all rules
-- re-checked server-side:
--   caller has story, target doesn't  -> target joins as editor
--   target has story, caller doesn't  -> caller joins as editor
--   neither has one                   -> new story, caller owner
-- ------------------------------------------
create or replace function public.pair_with_code(p_code text)
returns table (story_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target record;
  caller_story uuid;
  target_story uuid;
  new_story uuid;
  member_count int;
begin
  if caller is null then
    raise exception 'Not signed in';
  end if;

  select p.id, p.pair_code_expires_at into target
  from public.profiles p
  where p.pair_code = upper(btrim(coalesce(p_code, '')));

  if target.id is null then
    raise exception 'Code not found. Double-check and try again.';
  end if;

  if target.id = caller then
    raise exception 'That''s your own code.';
  end if;

  if target.pair_code_expires_at <= now() then
    raise exception 'This code has expired. Ask your partner for a new one.';
  end if;

  select sm.story_id into caller_story
  from public.story_members sm
  where sm.user_id = caller
  limit 1;

  select sm.story_id into target_story
  from public.story_members sm
  where sm.user_id = target.id
  limit 1;

  if caller_story is not null and caller_story = target_story then
    raise exception 'You''re already in a story together.';
  end if;

  if caller_story is not null and target_story is not null then
    raise exception 'You both have your own stories. One of you needs to leave their story first.';
  end if;

  if caller_story is not null then
    select count(*) into member_count
    from public.story_members smx
    where smx.story_id = caller_story;
    if member_count >= 2 then
      raise exception 'Your story already has two members.';
    end if;

    insert into public.story_members (story_id, user_id, role)
    values (caller_story, target.id, 'editor');

    return query select caller_story;
    return;
  end if;

  if target_story is not null then
    select count(*) into member_count
    from public.story_members smy
    where smy.story_id = target_story;
    if member_count >= 2 then
      raise exception 'Their story already has two members.';
    end if;

    insert into public.story_members (story_id, user_id, role)
    values (target_story, caller, 'editor');

    return query select target_story;
    return;
  end if;

  insert into public.stories (owner_id, title, cover_photo)
  values (caller, 'Our Story', '')
  returning id into new_story;

  insert into public.story_members (story_id, user_id, role)
  values
    (new_story, caller, 'owner'),
    (new_story, target.id, 'editor');

  return query select new_story;
end;
$$;
