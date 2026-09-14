import { supabase } from "../supabase/supabaseClient";

import { compareBackup } from "./compareBackup";

export async function restoreToDatabase({
  story,
  moments = [],
}) {
  //---------------------------------------
  // Get Existing Story
  //---------------------------------------

  const { data: existingStory } =
    await supabase
      .from("stories")
      .select("*")
      .limit(1)
      .maybeSingle();

  //---------------------------------------
  // Create Story Only If None Exists
  //---------------------------------------

  if (!existingStory && story) {
    const { error } =
      await supabase
        .from("stories")
        .insert(story);

    if (error) throw error;
  }

  //---------------------------------------
  // Load Existing Memories
  //---------------------------------------

  const { data: existingMoments, error } =
    await supabase
      .from("moments")
      .select("*");

  if (error) throw error;

  //---------------------------------------
  // Compare
  //---------------------------------------

  const summary = compareBackup(
    moments,
    existingMoments || []
  );

  //---------------------------------------
  // Insert New Memories
  //---------------------------------------

  if (
    summary.newMemories.length > 0
  ) {
    const memoriesToInsert =
      summary.newMemories.map((memory) => {
        const { id, ...rest } = memory;

        void id;

        return rest;
      });

    const { error } =
      await supabase
        .from("moments")
        .insert(memoriesToInsert);

    if (error) throw error;
  }

  //---------------------------------------
  // Update Changed Memories
  //---------------------------------------

  for (const update of summary.updates) {
    const {
      existing,
      incoming,
    } = update;

    const { error } =
      await supabase
        .from("moments")
        .update({
          title: incoming.title,
          description:
            incoming.description,
          memory_date:
            incoming.memory_date,
          location:
            incoming.location,
          image_url:
            incoming.image_url,
          is_favorite:
            incoming.is_favorite,
          category:
            incoming.category,
        })
        .eq(
          "id",
          existing.id
        );

    if (error) throw error;
  }

  //---------------------------------------

  return {
    success: true,

    inserted:
      summary.newMemories.length,

    updated:
      summary.updates.length,

    duplicates:
      summary.duplicates.length,
  };
}