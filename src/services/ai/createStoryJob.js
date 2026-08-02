import { supabase } from "../supabase/supabaseClient";

export async function createStoryJob(storyId) {
  // Check if a story already exists
  const { data: existing } = await supabase
    .from("ai_stories")
    .select("*")
    .eq("story_id", storyId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("ai_stories")
      .update({
        status: "pending",
        error_message: null,
        started_at: null,
        completed_at: null,
      })
      .eq("story_id", storyId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  const { data, error } = await supabase
    .from("ai_stories")
    .insert({
      story_id: storyId,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}