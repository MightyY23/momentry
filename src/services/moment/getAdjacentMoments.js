import { supabase } from "../supabase/supabaseClient";

export async function getAdjacentMoments(
  storyId,
  currentMomentId
) {
  const { data, error } = await supabase
    .from("moments")
    .select("id,title,memory_date")
    .eq("story_id", storyId)
    .order("memory_date", {
      ascending: true,
    });

  if (error) throw error;

  const index = data.findIndex(
    (m) => m.id === currentMomentId
  );

  return {
    previous:
      index > 0
        ? data[index - 1]
        : null,

    next:
      index < data.length - 1
        ? data[index + 1]
        : null,
  };
}