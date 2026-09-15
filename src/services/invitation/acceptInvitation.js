import { supabase } from "../supabase/supabaseClient";

export async function acceptInvitation(invitation) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Idempotency guard: if a previous attempt already
  // created the membership (e.g. it failed later while
  // updating the invitation), don't insert a duplicate.
  const { data: existing } = await supabase
    .from("story_members")
    .select("id")
    .eq("story_id", invitation.story_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    // Add the invited user as an editor.
    // (Legacy role "partner" was normalized to
    // editor by migration 014 — inserting
    // "partner" now violates the role check
    // constraint and acceptance always failed.)
    const { error: memberError } = await supabase
      .from("story_members")
      .insert({
        story_id: invitation.story_id,
        user_id: user.id,
        role: "editor",
      });

    if (memberError) throw memberError;
  }

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