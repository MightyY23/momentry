import { supabase } from "../supabase/supabaseClient";

export async function getMoments(storyId) {
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("story_id", storyId)
    .order("memory_date", { ascending: true });

  if (error) throw error;

  return data;
}