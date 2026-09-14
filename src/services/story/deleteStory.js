import { supabase } from "../supabase/supabaseClient";

export async function deleteStory(
  storyId
) {
  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId);

  if (error) throw error;
}
