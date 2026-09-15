import { supabase } from "../supabase/supabaseClient";

/**
 * Update the signed-in user's profile row.
 *
 * The row is created automatically at signup by
 * the handle_new_user trigger, so this is a plain
 * UPDATE — an upsert would require INSERT rights
 * and fail RLS ("new row violates row-level
 * security policy") even though the row exists.
 */
export async function updateProfile(
  userId,
  { fullName, avatarUrl, birthDate, onboardingCompleted }
) {
  const updates = {};

  if (fullName !== undefined) {
    updates.full_name = fullName;
  }

  if (avatarUrl !== undefined) {
    updates.avatar_url = avatarUrl;
  }

  if (birthDate !== undefined) {
    updates.birth_date = birthDate;
  }

  if (onboardingCompleted !== undefined) {
    updates.onboarding_completed = onboardingCompleted;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
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
