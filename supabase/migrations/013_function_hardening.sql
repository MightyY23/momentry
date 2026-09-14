-- ==========================================
-- FUNCTION HARDENING
--
-- Fixes the Supabase security advisor
-- findings:
--
-- 1. Mutable search_path on trigger
--    functions (handle_new_user,
--    update_ai_story_updated_at).
--    Their bodies are fully schema-qualified,
--    so an empty search_path is safe.
--
-- 2. SECURITY DEFINER functions executable
--    by clients that never need to call them:
--    - handle_new_user  (auth trigger only)
--    - rls_auto_enable  (DDL event trigger)
--    Revoking EXECUTE from anon/authenticated
--    keeps the triggers working — triggers
--    fire with the function owner's rights
--    and do not check client EXECUTE grants.
--
-- 3. is_story_member / is_story_owner are
--    used inside RLS policies, which run as
--    the querying role: authenticated keeps
--    EXECUTE. Anon never needs it.
-- ==========================================

-- ------------------------------------------
-- 1. Pin search_path (advisor 0011)
-- ------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url
  )
  values (
    new.id,
    '',
    ''
  );

  return new;
end;
$$;

create or replace function public.update_ai_story_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ------------------------------------------
-- 2. Lock down internal definer functions
--    (advisor 0028/0029)
-- ------------------------------------------

revoke execute on function public.handle_new_user()
    from anon, authenticated, public;

revoke execute on function public.rls_auto_enable()
    from anon, authenticated, public;

-- ------------------------------------------
-- 3. Scope RLS helper grants
-- ------------------------------------------

grant execute on function public.is_story_member(uuid)
    to authenticated;

revoke execute on function public.is_story_member(uuid)
    from anon, public;

grant execute on function public.is_story_owner(uuid)
    to authenticated;

revoke execute on function public.is_story_owner(uuid)
    from anon, public;
