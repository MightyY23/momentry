import { supabase } from "../supabase/supabaseClient";

/**
 * Delete the generated AI story for a
 * story (ai_stories.story_id is unique).
 */
export async function deleteAIStory(storyId) {
  const { error } = await supabase
    .from("ai_stories")
    .delete()
    .eq("story_id", storyId);

  if (error) throw error;
}
