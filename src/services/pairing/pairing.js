import { supabase } from "../supabase/supabaseClient";

/**
 * Partner-code pairing — no email required.
 * One partner shows their code, the other
 * enters it; all rules are enforced by
 * security definer RPCs server-side.
 *
 * Returns [{ pair_code, expires_at }] or [].
 */
export async function getOrCreatePairCode() {
  const { data, error } = await supabase.rpc(
    "get_or_create_pair_code"
  );

  if (error) throw error;
  return data || [];
}

/**
 * Force a fresh 7-day code.
 */
export async function regeneratePairCode() {
  const { data, error } = await supabase.rpc(
    "regenerate_pair_code"
  );

  if (error) throw error;
  return data || [];
}

/**
 * Preview who a code belongs to before
 * pairing. Resolves to:
 *   { valid: true, fullName, avatarUrl }
 *   { valid: false, reason }
 */
export async function lookupPairCode(code) {
  const { data, error } = await supabase.rpc(
    "lookup_pair_code",
    { p_code: code }
  );

  if (error) throw error;

  const row = (data || [])[0];

  if (!row) {
    return { valid: false, reason: "Lookup failed — try again." };
  }

  if (!row.valid) {
    return { valid: false, reason: row.reason };
  }

  return {
    valid: true,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
  };
}

/**
 * The pair itself — atomic, server-side
 * validated. Returns the story id you now
 * share.
 */
export async function pairWithCode(code) {
  const { data, error } = await supabase.rpc(
    "pair_with_code",
    { p_code: code }
  );

  if (error) throw error;
  return (data || [])[0]?.story_id ?? null;
}
