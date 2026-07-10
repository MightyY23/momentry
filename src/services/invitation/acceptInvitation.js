import { supabase } from "../supabase/supabaseClient";

export async function acceptInvitation(invitationId, storyId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Add partner to story
  const { error: memberError } = await supabase
    .from("story_members")
    .insert({
      story_id: storyId,
      user_id: user.id,
      role: "partner",
    });

  if (memberError) {
    throw memberError;
  }

  // Mark invitation accepted
  const { error: invitationError } = await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq("id", invitationId);

  if (invitationError) {
    throw invitationError;
  }
}