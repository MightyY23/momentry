import { supabase } from "../supabase/supabaseClient";

import { uploadImage, deleteImage } from "../storage/uploadImage";

import { getMyStory } from "../story/getStory";

/**
 * Photos without memories — the shared
 * gallery wall. Every member can add;
 * own photos (or the owner) can remove.
 */

export async function getGalleryPhotos() {
  const story = await getMyStory();

  if (!story) return [];

  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, image_url, added_by, created_at")
    .eq("story_id", story.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Upload one or many photos at once.
 * Returns the created rows.
 */
export async function addGalleryPhotos(files) {
  const story = await getMyStory();

  if (!story) {
    throw new Error(
      "Create a story first to add photos."
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const created = [];

  for (const file of files) {
    const url = await uploadImage(file);

    const { data, error } = await supabase
      .from("gallery_photos")
      .insert({
        story_id: story.id,
        added_by: user.id,
        image_url: url,
      })
      .select("id, image_url, added_by, created_at")
      .single();

    if (error) {
      // Roll back the storage file so no
      // orphans linger on a failed insert.
      await deleteImage(url);
      throw error;
    }

    created.push(data);
  }

  return created;
}

export async function deleteGalleryPhoto(photo) {
  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", photo.id);

  if (error) throw error;

  await deleteImage(photo.image_url);
}
