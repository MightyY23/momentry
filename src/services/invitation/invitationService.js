import { supabase } from "../supabase/supabaseClient";

export async function createInvitation(storyId, email) {
  const { error } = await supabase
    .from("invitations")
    .insert({
      story_id: storyId,
      email,
    });

  if (error) {
    throw error;
  }
}