-- ============================================================
-- RPC GRANT HARDENING (audit fix)
--
-- information_schema.routine_privileges showed PUBLIC
-- EXECUTE on four functions — default-acl leftovers the
-- explicit per-function GRANTs don't remove (the pair-code
-- functions predate migration 013's hardening style, and
-- set_story_anniversary only added explicit grants).
--
-- None of these need anon or PUBLIC access:
--   * generate_pair_code / get_or_create_pair_code /
--     regenerate_pair_code -> signed-in users only
--   * lookup_pair_code   -> signed-in (pairing UI)
--   * pair_with_code     -> signed-in (pairing UI)
--   * set_story_anniversary -> authenticated (member check
--     inside); anon never calls it
-- ============================================================

revoke execute on function public.generate_pair_code()
  from public, anon;

revoke execute on function public.get_or_create_pair_code()
  from public, anon;

revoke execute on function public.regenerate_pair_code()
  from public, anon;

revoke execute on function public.lookup_pair_code(text)
  from public, anon;

revoke execute on function public.pair_with_code(text)
  from public, anon;

revoke execute on function public.set_story_anniversary(uuid, date)
  from public;

-- Re-assert the intended grants so nothing is accidentally
-- narrower than the app needs.

grant execute on function public.generate_pair_code()
  to authenticated;

grant execute on function public.get_or_create_pair_code()
  to authenticated;

grant execute on function public.regenerate_pair_code()
  to authenticated;

grant execute on function public.lookup_pair_code(text)
  to authenticated;

grant execute on function public.pair_with_code(text)
  to authenticated;

grant execute on function public.set_story_anniversary(uuid, date)
  to authenticated;
