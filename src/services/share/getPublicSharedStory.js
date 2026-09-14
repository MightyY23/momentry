import { supabase } from "../supabase/supabaseClient";

/**
 * Fetch a public shared story via RPC.
 * Pass a password for protected shares.
 *
 * Returns { story, moments } where `story`
 * is null when the code is invalid, revoked,
 * expired — or the password didn't match.
 */
export async function getPublicSharedStory(
  shareCode,
  password = null
) {
  const { data, error } = await supabase
    .rpc("get_public_shared_story", {
      p_share_code: shareCode,
      p_password: password,
    });

  if (error) throw error;

  const rows = data || [];

  if (rows.length === 0) {
    return { story: null, moments: [] };
  }

  const story = {
    id: rows[0].story_id,
    title: rows[0].story_title,
    cover_photo: rows[0].cover_photo,
  };

  const moments = rows
    .filter((row) => row.moment_id)
    .map((row) => ({
      id: row.moment_id,
      title: row.moment_title,
      description: row.moment_description,
      memory_date: row.memory_date,
      image_url: row.image_url,
      location: row.location,
      is_favorite: row.is_favorite,
    }));

  return { story, moments };
}
