import { supabase } from "../supabase/supabaseClient";

export async function getMyStory() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  // Find the story this user belongs to
  const { data: membership, error: membershipError } = await supabase
    .from("story_members")
    .select("story_id")
    .eq("user_id", user.id)
    .single();

  if (membershipError) throw membershipError;

  // Load the story
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", membership.story_id)
    .single();

  if (storyError) throw storyError;

  return story;
}