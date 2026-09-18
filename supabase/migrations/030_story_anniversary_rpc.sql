-- ============================================================
-- 030 — STORY ANNIVERSARY RPC  (v2: also allows correction)
--
-- Onboarding lets ANY member record the day the relationship
-- began; Settings lets either partner CORRECT it later.
--
--   select set_story_anniversary('<story-uuid>', '2024-02-14');
--
-- Rules:
--   * caller must be authenticated
--   * caller must be a member of the story
--   * date may not be in the future
--   * fills an empty date; a member may overwrite an
--     existing one (correction flow) — the previous value
--     is returned so callers can show what changed
-- ============================================================

create or replace function public.set_story_anniversary(
  p_story_id uuid,
  p_date date
)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_previous date;
begin
  if v_uid is null then
    raise exception 'You must be signed in.';
  end if;

  if p_date is null then
    raise exception 'Pick a date first.';
  end if;

  if p_date > current_date then
    raise exception 'The anniversary date cannot be in the future.';
  end if;

  if not exists (
    select 1
    from public.story_members m
    where m.story_id = p_story_id
      and m.user_id = v_uid
  ) then
    raise exception 'You are not a member of this story.';
  end if;

  select anniversary_date
    into v_previous
    from public.stories
    where id = p_story_id;

  update public.stories
    set anniversary_date = p_date
    where id = p_story_id;

  return v_previous;
end;
$$;

grant execute on function public.set_story_anniversary(uuid, date)
  to authenticated;

revoke execute on function public.set_story_anniversary(uuid, date)
  from anon;
