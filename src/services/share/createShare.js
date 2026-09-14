import { supabase } from "../supabase/supabaseClient";

/**
 * Create a share link for a story (owner only).
 *
 * @param {string} storyId
 * @param {object} [options]
 * @param {string|null} [options.password] Plaintext is hashed server-side
 *        (bcrypt) — never stored or readable afterwards.
 * @param {string|null} [options.expiresAt] ISO timestamp, or null for no expiry.
 * @param {boolean} [options.includeLocations] Show place names publicly (default true).
 * @returns {object} The created shared_stories row (incl. share_code).
 */
export async function createShare(
  storyId,
  {
    password = null,
    expiresAt = null,
    includeLocations = true,
  } = {}
) {
  const { data, error } = await supabase.rpc(
    "create_share_link",
    {
      p_story_id: storyId,
      p_password: password || null,
      p_expires_at: expiresAt,
      p_include_locations: includeLocations,
    }
  );

  if (error) throw error;

  return data;
}
