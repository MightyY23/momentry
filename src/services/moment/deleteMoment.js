import { supabase } from "../supabase/supabaseClient";

export async function deleteMoment(moment) {
  // Delete image from Storage
  if (moment.image_url) {
    const imagePath = moment.image_url.split("/").pop();

    const { error: storageError } = await supabase.storage
      .from("moment-images")
      .remove([imagePath]);

    if (storageError) {
      throw storageError;
    }
  }

  // Delete database row
  const { error } = await supabase
    .from("moments")
    .delete()
    .eq("id", moment.id);

  if (error) {
    throw error;
  }
}