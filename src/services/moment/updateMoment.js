import { supabase } from "../supabase/supabaseClient";

export async function updateMoment(id, updates) {
  const { data, error } = await supabase
    .from("moments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}