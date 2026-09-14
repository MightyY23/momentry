import { supabase } from "../supabase/supabaseClient";

//----------------------------------------
// Validation rules
//----------------------------------------

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file) {
  if (!file) {
    return "No image selected.";
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return "Unsupported image format. Use JPG, PNG, WebP, GIF or HEIC.";
  }

  if (file.size > MAX_SIZE_BYTES) {
    return "Image is too large. Maximum size is 10 MB.";
  }

  return null;
}

/**
 * Extract the storage object path from a
 * public URL: ".../moment-images/<userId>/<file>"
 * -> "<userId>/<file>"
 */
export function extractObjectPath(publicUrl) {
  const marker = "/moment-images/";

  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return publicUrl.slice(markerIndex + marker.length);
}

/**
 * Delete a stored image by its public URL.
 * Never throws — storage cleanup failures
 * are logged so DB operations aren't blocked.
 */
export async function deleteImage(publicUrl) {
  if (!publicUrl) return;

  const objectPath = extractObjectPath(publicUrl);

  if (!objectPath) {
    console.warn(
      "deleteImage: not a moment-images URL, skipping:",
      publicUrl
    );

    return;
  }

  const { error } = await supabase.storage
    .from("moment-images")
    .remove([objectPath]);

  if (error) {
    console.error(
      "deleteImage: storage cleanup failed:",
      error
    );
  }
}

/**
 * Upload an image into the signed-in user's
 * own storage folder (enforced by RLS).
 *
 * Throws Error with a user-friendly message —
 * callers show it directly in toasts.
 */
export async function uploadImage(file) {
  const validationError =
    validateImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "You need to be signed in to upload images."
    );
  }

  // Safe storage path: own folder + timestamp
  // + sanitized extension.
  const rawExt = file.name.split(".").pop() || "jpg";

  const safeExt = rawExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5) || "jpg";

  const fileName = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage
    .from("moment-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    if (error.message?.includes("size")) {
      throw new Error(
        "Image is too large. Maximum size is 10 MB."
      );
    }

    throw new Error(
      error.message ||
        "Upload failed. Please try again."
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("moment-images")
    .getPublicUrl(fileName);

  return publicUrl;
}
