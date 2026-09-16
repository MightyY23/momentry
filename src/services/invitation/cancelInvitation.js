import { supabase } from "../supabase/supabaseClient";

/**
 * Cancel a pending invitation (story-owner
 * action). RLS: invitations_delete_owner —
 * only the story owner's delete goes through;
 * anything else is rejected by the database.
 */
export async function cancelInvitation(
  invitationId
) {
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) throw error;

  return true;
}
