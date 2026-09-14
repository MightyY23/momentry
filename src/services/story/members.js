import { supabase } from "../supabase/supabaseClient";

/**
 * List a story's members with profile info.
 * RLS: only story members can read the list.
 */
export async function getStoryMembers(storyId) {
  const { data, error } = await supabase
    .from("story_members")
    .select(
      `
      id,
      user_id,
      role,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("story_id", storyId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

/**
 * Remove a member. RLS: owner-only, and the
 * owner can never remove themselves.
 */
export async function removeStoryMember(memberId) {
  const { error } = await supabase
    .from("story_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

/**
 * Change a member's role.
 * RLS: owner-only, never on their own row.
 */
export async function updateMemberRole(
  memberId,
  role
) {
  if (
    !["owner", "editor", "viewer"].includes(
      role
    )
  ) {
    throw new Error(
      "Invalid role."
    );
  }

  const { error } = await supabase
    .from("story_members")
    .update({ role })
    .eq("id", memberId);

  if (error) throw error;
}
