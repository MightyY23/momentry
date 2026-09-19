import { supabase } from "../supabase/supabaseClient";

export async function getAIStory(storyId) {
  const { data, error } = await supabase
    .from("ai_stories")
    .select("*")
    .eq("story_id", storyId)
    .maybeSingle();

  if (error) {
    console.error("getAIStory:", error);
    return null;
  }

  return data;
}

/**
 * Regenerate = the same contract as a
 * first generation when no row exists,
 * or reset + direct invoke when one does.
 * Explicit alias for readability at call
 * sites.
 */
export const regenerateAIStory =
  startStoryGeneration;

/**
 * Kick off AI story generation.
 *
 * Flow (both first generation AND
 * regeneration — no DB trigger involved):
 *   1. Upsert the ai_stories row to
 *      "pending" so the UI shows the
 *      writing state immediately.
 *   2. Invoke the generate-story Edge
 *      Function directly with the user's
 *      session (it verifies JWT + story
 *      membership server-side).
 */
export async function startStoryGeneration(
  storyId
) {
  // Upsert the job row: first generation
  // inserts, regeneration resets. story_id
  // is UNIQUE (migration 033), so this is
  // safe in both directions.
  const { error: upsertError } = await supabase
    .from("ai_stories")
    .upsert(
      {
        story_id: storyId,
        status: "pending",
        error_message: null,
        started_at: null,
        completed_at: null,
      },
      { onConflict: "story_id" }
    );

  if (upsertError) throw upsertError;

  // Fire the generator with the caller's
  // session — supabase-js attaches the
  // JWT automatically.
  const { error: fnError } =
    await supabase.functions.invoke(
      "generate-story",
      {
        body: { storyId },
      }
    );

  if (fnError) throw fnError;
}
