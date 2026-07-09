import { supabase } from "../supabase/supabaseClient";

export async function createStory(title) {
  // Get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.log("Current user:", user);

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  // Create story
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .insert({
      owner_id: user.id,
      title,
      cover_photo: "",
    })
    .select()
    .single();

  if (storyError) {
    throw storyError;
  }

  // Add creator as owner
  const { error: memberError } = await supabase
    .from("story_members")
    .insert({
      story_id: story.id,
      user_id: user.id,
      role: "owner",
    });

  // Roll back if membership creation fails
  if (memberError) {
    await supabase
      .from("stories")
      .delete()
      .eq("id", story.id);

    throw memberError;
  }

  return story;
}