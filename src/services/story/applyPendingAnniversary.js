import { supabase } from "../supabase/supabaseClient";

//----------------------------------------
// Pending anniversary bridge.
//
// Onboarding collects "when did your story
// begin?" BEFORE any story exists (the user
// lands on create-story / pair / accept-
// invitation afterwards). The date is
// therefore stashed in localStorage and
// applied by whichever exit creates the
// story — via the set_story_anniversary
// security-definer RPC, which any story
// member may call.
//
// Key is cleared as soon as it applies so
// it never leaks into a future story.
//----------------------------------------

const STORAGE_KEY = "momentry:pending-anniversary";

export function stashPendingAnniversary(date) {
  try {
    if (date) {
      localStorage.setItem(STORAGE_KEY, date);
    }
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function peekPendingAnniversary() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Applies the stashed date to the user's
 * story (if they have one) and clears the
 * stash. Returns true when the date was
 * actually saved.
 */
export async function applyPendingAnniversary() {
  let date;

  try {
    date = localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }

  if (!date) return false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: membership } = await supabase
      .from("story_members")
      .select("story_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const storyId = membership?.story_id;

    if (!storyId) return false;

    const { error } = await supabase.rpc(
      "set_story_anniversary",
      {
        p_story_id: storyId,

        p_date: date,
      }
    );

    if (error) throw error;

    return true;
  } catch (err) {
    console.error(
      "applyPendingAnniversary:",
      err
    );

    return false;
  } finally {
    // Always clear — a stale date must not
    // attach itself to a different story.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
