import { supabase } from "../supabase/supabaseClient";

export async function getMyStory() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  // Find the story membership
  const { data: membership, error: membershipError } = await supabase
    .from("story_members")
    .select("story_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError) {
    throw membershipError;
  }

  // Load the story
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", membership.story_id)
    .single();

  if (storyError) {
    throw storyError;
  }

  return story;
}