-- ==========================================
-- ONBOARDING, OCCASIONS & REALTIME (020)
--
-- 1. profiles.birth_date + onboarding_completed
--    power the new onboarding flow and the
--    birthday reminder feature.
-- 2. stories.anniversary_date powers the
--    anniversary reminder.
-- 3. profiles joins the supabase_realtime
--    publication so avatar/name changes
--    propagate instantly without reloads.
-- ==========================================

alter table public.profiles
    add column if not exists birth_date date;

alter table public.profiles
    add column if not exists onboarding_completed
        boolean not null default false;

alter table public.stories
    add column if not exists anniversary_date date;

-- ------------------------------------------
-- Signup trigger: seed metadata + onboarding
-- ------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    birth_date,
    onboarding_completed
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name', ''
    ),
    '',
    null,
    false
  )
  on conflict (id) do nothing;

  return new;

end;
$$;

-- ------------------------------------------
-- Realtime: profiles
-- (moments: 019, stories/story_members: 001)
-- ------------------------------------------

-- The table may already be in the publication
-- on some environments; make this idempotent.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'profiles'
  ) then
    alter publication supabase_realtime
        add table public.profiles;
  end if;
end $$;
