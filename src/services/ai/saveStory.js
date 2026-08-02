import { supabase } from "../supabase/supabaseClient";

export async function saveStory(
  storyId,
  title,
  content
) {
  const { error } = await supabase
    .from("ai_stories")
    .upsert({
      story_id: storyId,
      title,
      content,
    });

  if (error) throw error;
}