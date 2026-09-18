import { supabase } from "../supabase/supabaseClient";

/**
 * Set (or correct) the day the relationship
 * began — the story's anniversary.
 *
 * Uses the security-definer RPC so BOTH the
 * owner and the invited partner can manage
 * the date. Returns the previous value
 * (null when it was empty).
 */
export async function setStoryAnniversary(
  storyId,
  date
) {
  const { data, error } = await supabase.rpc(
    "set_story_anniversary",
    {
      p_story_id: storyId,
      p_date: date,
    }
  );

  if (error) throw error;

  return data;
}
