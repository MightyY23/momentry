-- ============================================================
-- 030 — STORY ANNIVERSARY RPC
--
-- The onboarding flow lets ANY member (owner or invited
-- partner) record the day the relationship began. The base
-- stories UPDATE policy is owner-only, so members write
-- through this security definer RPC instead:
--
--   select set_story_anniversary('<story-uuid>', '2024-02-14');
--
-- Rules:
--   * caller must be authenticated
--   * caller must be a member of the story
--   * date may not be in the future
--   * only fills an EMPTY anniversary_date — it can never
--     silently overwrite an existing one (edit via Settings)
-- ============================================================

create or replace function public.set_story_anniversary(
  p_story_id uuid,
  p_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
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

  update public.stories
    set anniversary_date = p_date
    where id = p_story_id
      and anniversary_date is null;

  if not found then
    raise exception 'An anniversary date is already set for this story.';
  end if;
end;
$$;

grant execute on function public.set_story_anniversary(uuid, date)
  to authenticated;

revoke execute on function public.set_story_anniversary(uuid, date)
  from anon;
