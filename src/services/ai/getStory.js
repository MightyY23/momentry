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
 * Live DB contract:
 *   - ai_stories.story_id is UNIQUE (one row
 *     per story).
 *   - An AFTER INSERT trigger ("Generate AI
 *     Story") POSTs to the edge function.
 *   - The trigger does NOT fire on UPDATE,
 *     so for re-generation we reset the row
 *     AND invoke the function directly.
 */
export async function startStoryGeneration(
  storyId
) {
  const existing = await getAIStory(
    storyId
  );

  if (existing) {
    // Reset the job so the UI shows the
    // "writing" state immediately.
    const { error: resetError } =
      await supabase
        .from("ai_stories")
        .update({
          status: "pending",
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq("story_id", storyId);

    if (resetError) throw resetError;

    // Trigger doesn't fire on update —
    // call the function ourselves.
    const { error: fnError } =
      await supabase.functions.invoke(
        "generate-story",
        {
          body: { storyId },
        }
      );

    if (fnError) throw fnError;

    return;
  }

  // First generation: inserting the job row
  // fires the "Generate AI Story" trigger,
  // which invokes the edge function.
  const { error: insertError } = await supabase
    .from("ai_stories")
    .insert({
      story_id: storyId,
      status: "pending",
    });

  if (insertError) throw insertError;
}
