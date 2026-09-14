import { supabase } from "../supabase/supabaseClient";

export async function deleteMoment(moment) {
  // Delete image from Storage.
  // Files live under "<userId>/<timestamp>.<ext>",
  // so the full object path (not just the file
  // name) is required to satisfy the storage
  // policies.
  if (moment.image_url) {
    const marker = "/moment-images/";

    const markerIndex =
      moment.image_url.indexOf(marker);

    const objectPath =
      markerIndex === -1
        ? null
        : moment.image_url.slice(
            markerIndex + marker.length
          );

    if (objectPath) {
      const { error: storageError } =
        await supabase.storage
          .from("moment-images")
          .remove([objectPath]);

      if (storageError) {
        // A storage failure shouldn't block
        // removing the database row — the
        // orphaned file can be cleaned up later.
        console.error(
          "deleteMoment: storage cleanup failed:",
          storageError
        );
      }
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