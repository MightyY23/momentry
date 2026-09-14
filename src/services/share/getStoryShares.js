import { supabase } from "../supabase/supabaseClient";

/**
 * List all share links for a story (owner only).
 * Returns share_code, is_public, created_at,
 * expires_at and is_protected (boolean).
 */
export async function getStoryShares(
  storyId
) {
  const { data, error } = await supabase.rpc(
    "get_story_shares",
    { p_story_id: storyId }
  );

  if (error) throw error;

  return data || [];
}
