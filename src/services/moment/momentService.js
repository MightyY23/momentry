import { supabase } from "../supabase/supabaseClient";

export async function createMoment(moment) {
  const { data, error } = await supabase
    .from("moments")
    .insert(moment)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}