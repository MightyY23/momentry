import { supabase } from "../supabase/supabaseClient";

export async function checkStoryStatus(storyId) {
  const { data, error } = await supabase
    .from("ai_stories")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  return data;
}