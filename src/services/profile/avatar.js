import {
  uploadImage,
  deleteImage,
} from "../storage/uploadImage";

/**
 * Upload a new avatar for the user.
 * If they had a previous avatar, the old
 * file is deleted ONLY after the new
 * upload succeeds (never before).
 *
 * The avatar reuses the moment-images
 * bucket (per-user folder RLS applies).
 */
export async function uploadAvatar(
  file,
  previousAvatarUrl
) {
  const newUrl = await uploadImage(file);

  if (previousAvatarUrl) {
    await deleteImage(previousAvatarUrl);
  }

  return newUrl;
}

/**
 * Remove the user's avatar file, if any.
 */
export async function removeAvatar(avatarUrl) {
  if (!avatarUrl) return;

  await deleteImage(avatarUrl);
}
