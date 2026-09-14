import { supabase } from "../supabase/supabaseClient";

/**
 * Decline a pending invitation.
 * RLS ensures only the invited user
 * (invitation.email = auth email) can
 * update the row.
 */
export async function declineInvitation(invitationId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "You need to be signed in."
    );
  }

  // Scope the update to pending invitations
  // addressed to THIS user — never someone
  // else's invite.
  const { data, error } = await supabase
    .from("invitations")
    .update({
      status: "declined",
    })
    .eq("id", invitationId)
    .eq("email", user.email)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "This invitation can't be declined — it may already have been handled."
    );
  }

  return true;
}
