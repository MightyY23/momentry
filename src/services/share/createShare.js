import { supabase }
from "../supabase/supabaseClient";

import { generateShareCode }
from "./generateShareCode";

export async function createShare(
  storyId
) {

  const shareCode =
    generateShareCode();

  const { data, error } =
    await supabase
      .from("shared_stories")
      .insert({
        story_id: storyId,

        share_code: shareCode,

        is_public: true,
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}