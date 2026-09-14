import { supabase } from "../supabase/supabaseClient";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Create a story invitation with full
 * validation. Throws Error with a
 * user-friendly message on any failure.
 */
export async function createInvitation(
  storyId,
  email
) {
  const trimmed = (email || "")
    .trim()
    .toLowerCase();

  //----------------------------------------
  // 1. Valid email
  //----------------------------------------

  if (!EMAIL_RE.test(trimmed)) {
    throw new Error(
      "Please enter a valid email address."
    );
  }

  //----------------------------------------
  // 2. Authenticated user
  //----------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "You need to be signed in."
    );
  }

  //----------------------------------------
  // 3. Cannot invite yourself
  //----------------------------------------

  if (
    trimmed ===
    (user.email || "").toLowerCase()
  ) {
    throw new Error(
      "That's your own email — you're already in this story. 💛"
    );
  }

  //----------------------------------------
  // 4. Not already a member
  // (story members' emails via profiles)
  //----------------------------------------

  const { data: existingMembers } =
    await supabase
      .from("story_members")
      .select(
        "id, profiles!inner(email)"
      )
      .eq("story_id", storyId);

  const memberEmails = (
    existingMembers || []
  ).map(
    (m) =>
      m.profiles?.email?.toLowerCase()
  );

  if (
    memberEmails.includes(trimmed)
  ) {
    throw new Error(
      "That person is already part of this story."
    );
  }

  //----------------------------------------
  // 5. No duplicate pending invitation
  //----------------------------------------

  const { data: pending } =
    await supabase
      .from("invitations")
      .select("id")
      .eq("story_id", storyId)
      .eq("email", trimmed)
      .eq("status", "pending")
      .maybeSingle();

  if (pending) {
    throw new Error(
      "An invitation for that email is already pending."
    );
  }

  //----------------------------------------
  // 6. Insert (RLS enforces owner-only)
  //----------------------------------------

  const { error } = await supabase
    .from("invitations")
    .insert({
      story_id: storyId,
      email: trimmed,
    });

  if (error) throw error;

  return true;
}
