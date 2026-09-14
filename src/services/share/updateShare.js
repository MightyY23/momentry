import { supabase } from "../supabase/supabaseClient";

/**
 * Update a share link (owner only).
 *
 * @param {string} shareId
 * @param {object} [options]
 * @param {boolean|null} [options.isPublic]    Toggle public/private.
 * @param {string|null}  [options.expiresAt]   New expiry (ISO) — null leaves it.
 * @param {string|null}  [options.password]    New password (hashed server-side).
 * @param {boolean}      [options.clearPassword] Remove password protection.
 * @param {boolean|null} [options.includeLocations] Show/hide place names.
 * @returns {void}
 */
export async function updateShare(
  shareId,
  {
    isPublic = null,
    expiresAt = null,
    password = null,
    clearPassword = false,
    includeLocations = null,
  } = {}
) {
  const { error } = await supabase.rpc(
    "update_share_link",
    {
      p_share_id: shareId,
      p_is_public: isPublic,
      p_expires_at: expiresAt,
      p_password: password,
      p_clear_password: clearPassword,
      p_include_locations: includeLocations,
    }
  );

  if (error) throw error;
}
