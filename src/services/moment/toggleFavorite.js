import { supabase } from "../supabase/supabaseClient";

export async function toggleFavorite(momentId, currentValue) {
  const { data, error } = await supabase
    .from("moments")
    .update({
      is_favorite: !currentValue,
    })
    .eq("id", momentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}