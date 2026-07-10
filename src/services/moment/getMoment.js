import { supabase } from "../supabase/supabaseClient";

export async function getMoment(id) {
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}