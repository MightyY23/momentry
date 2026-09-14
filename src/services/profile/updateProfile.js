import { supabase } from "../supabase/supabaseClient";

/**
 * Upsert the signed-in user's profile row.
 * (The profile row is usually created by the
 * handle_new_user trigger — this keeps it fresh.)
 */
export async function updateProfile(userId, { fullName, avatarUrl }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: fullName ?? null,
      avatar_url: avatarUrl ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Fetch the current user's profile (may be null).
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}
