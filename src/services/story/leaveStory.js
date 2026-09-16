import { supabase } from "../supabase/supabaseClient";

/**
 * Leave the current story (unpair).
 *
 * Deletes the caller's own story_members
 * row — RLS allows self-delete only, so a
 * member can never remove someone else
 * through this path (owners remove members
 * via removeStoryMember instead).
 *
 * The memories this member created stay
 * with the story; their access simply ends.
 * Re-pairing afterwards requires a new
 * invitation from the owner.
 */
export async function leaveStory(storyId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { error } = await supabase
    .from("story_members")
    .delete()
    .eq("story_id", storyId)
    .eq("user_id", user.id);

  if (error) throw error;

  return { mode: "left" };
}
