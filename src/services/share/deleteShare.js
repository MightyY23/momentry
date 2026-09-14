import { supabase } from "../supabase/supabaseClient";

/**
 * Revoke (delete) a share link.
 * RLS: only the story owner can delete.
 */
export async function deleteShare(id) {
  const { error } = await supabase
    .from("shared_stories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}