import { supabase } from "../supabase/supabaseClient";

export async function getAIStory(storyId) {
  const { data, error } = await supabase
    .from("ai_stories")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}