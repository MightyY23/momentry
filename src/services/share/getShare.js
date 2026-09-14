import { supabase } from "../supabase/supabaseClient";

/**
 * Fetch share metadata via the public RPC.
 * Pass the password for protected shares.
 */
export async function getShare(code, password = null) {
  const { data, error } = await supabase
    .rpc("get_public_share", {
      p_share_code: code,
      p_password: password,
    })
    .single();

  if (error) throw error;

  return {
    share_code: data.share_code,
    story_id: data.story_id,
    is_public: true,

    stories: {
      id: data.story_id,
      title: data.title,
      cover_photo: data.cover_photo,
      created_at: data.created_at,
    },
  };
}
