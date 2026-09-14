import { supabase } from "../supabase/supabaseClient";

export async function updateStory(
  storyId,
  updates
) {
  const { data, error } = await supabase
    .from("stories")
    .update(updates)
    .eq("id", storyId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
