import { supabase } from "../supabase/supabaseClient";

export async function createStory(title) {
  // Get the currently signed-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  // Create the story
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .insert({
      owner_id: user.id,
      title,
    })
    .select()
    .single();

  if (storyError) {
    throw storyError;
  }

  // Add the owner as a member
  const { error: memberError } = await supabase
    .from("story_members")
    .insert({
      story_id: story.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    throw memberError;
  }

  return story;
}