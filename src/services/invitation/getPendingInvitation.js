import { supabase } from "../supabase/supabaseClient";

export async function getPendingInvitation(email) {
  // A stale pending row can linger if a previous
  // acceptance failed halfway (the old RLS
  // chicken-and-egg bug). Only invitations whose
  // story the user has NOT already joined count —
  // otherwise login would loop users back to
  // /accept-invitation and risk duplicate rows.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Invitations are always stored lowercased
  // (createInvitation normalizes); signing up
  // with mixed case must still match.
  const normalizedEmail = (email || "")
    .trim()
    .toLowerCase();

  // 1. All pending invitations for this email.
  const { data: invitations, error } = await supabase
    .from("invitations")
    .select(
      `*,
      stories (
        id,
        title
      )`
    )
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!invitations || invitations.length === 0) {
    return null;
  }

  // 2. Stories this user already belongs to.
  const { data: memberships, error: memberError } =
    await supabase
      .from("story_members")
      .select("story_id")
      .eq(
        "user_id",
        user?.id ??
          "00000000-0000-0000-0000-000000000000"
      );

  if (memberError) throw memberError;

  const joinedStoryIds = new Set(
    (memberships ?? []).map((m) => m.story_id)
  );

  // 3. First pending invitation not yet joined.
  return (
    invitations.find(
      (inv) => !joinedStoryIds.has(inv.story_id)
    ) ?? null
  );
}