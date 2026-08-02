import { supabase }
from "../supabase/supabaseClient";

export async function getShare(
  code
) {
  const { data, error } =
    await supabase
      .from("shared_stories")
      .select(`
        *,
        stories(*)
      `)
      .eq(
        "share_code",
        code
      )
      .single();

  if (error) throw error;

  return data;
}