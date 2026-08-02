import { supabase }
from "../supabase/supabaseClient";

export async function deleteShare(
  id
) {
  const { error } =
    await supabase
      .from("shared_stories")
      .delete()
      .eq("id", id);

  if (error) throw error;
}