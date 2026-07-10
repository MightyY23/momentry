import { supabase } from "../supabase/supabaseClient";

export async function acceptInvitation(invitation) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Add partner to story
  const { error: memberError } = await supabase
    .from("story_members")
    .insert({
      story_id: invitation.story_id,
      user_id: user.id,
      role: "partner",
    });

  if (memberError) throw memberError;

  // Mark invitation accepted
  const { error: invitationError } = await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq("id", invitation.id);

  if (invitationError) throw invitationError;

  return true;
}