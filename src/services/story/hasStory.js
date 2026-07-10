import { supabase } from "../supabase/supabaseClient";

export async function userHasStory() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("story_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}