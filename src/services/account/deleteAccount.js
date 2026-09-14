import { supabase } from "../supabase/supabaseClient";

/**
 * Permanently delete the signed-in account
 * and all associated data, via the
 * `delete-account` edge function.
 *
 * The edge function verifies the user's JWT,
 * cleans storage + all dependent rows, then
 * removes the auth user.
 */
export async function deleteAccount() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error(
      "You need to be signed in to do that."
    );
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  const result = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Account deletion failed. Please try again."
    );
  }

  return result;
}
