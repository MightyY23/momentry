import { supabase } from "../supabase/supabaseClient";

export async function getPendingInvitation(email) {
  const { data, error } = await supabase
    .from("invitations")
    .select(`
      *,
      stories (
        id,
        title
      )
    `)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw error;

  return data;
}