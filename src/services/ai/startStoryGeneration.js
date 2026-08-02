import { supabase } from "../supabase/supabaseClient";

export async function startStoryGeneration(storyId) {
  const { data, error } = await supabase.functions.invoke(
    "generate-story",
    {
      body: {
        storyId,
      },
    }
  );

  if (error) throw error;

  return data;
}