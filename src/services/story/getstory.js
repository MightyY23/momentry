import { supabase } from "../supabase/supabaseClient";

export async function getMyStory() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data.length ? data[0] : null;
}