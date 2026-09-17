import { supabase } from "../supabase/supabaseClient";

import {
  normalizeImageFile,
  guessExtension,
} from "../storage/imageUtils";

import { deleteImage } from "../storage/uploadImage";

import { getMyStory } from "../story/getStory";

//----------------------------------------
// Photo Wall media — photos AND videos.
// Everything lands in the user's own
// folder of the moment-images bucket
// (RLS-enforced). Photos keep the
// normalization pipeline (HEIC decode,
// downscale); videos pass through with a
// 50 MB cap.
//----------------------------------------

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const VIDEO_EXTS = new Set([
  "mp4",
  "m4v",
  "mov",
  "webm",
  "mkv",
  "avi",
  "3gp",
  "3g2",
  "mpeg",
  "mpg",
]);

const VIDEO_MIME_BY_EXT = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
};

function fileExt(file) {
  return (
    file.name.split(".").pop() || ""
  )
    .toLowerCase();
}

/**
 * Decide photo vs video and resolve a
 * usable MIME even when the picker sends
 * an empty type (common on mobile).
 */
async function classifyMedia(file) {
  const ext = fileExt(file);

  if (file.type?.startsWith("video/")) {
    return {
      kind: "video",
      mimeType: file.type,
    };
  }

  if (VIDEO_EXTS.has(ext)) {
    return {
      kind: "video",
      mimeType:
        VIDEO_MIME_BY_EXT[ext] || "video/mp4",
    };
  }

  if (file.type?.startsWith("image/")) {
    return {
      kind: "image",
      mimeType: file.type,
    };
  }

  // Empty/odd type — sniff the bytes so
  // random documents get rejected but
  // extensionless photos pass.
  const head = new Uint8Array(
    await file.slice(0, 32).arrayBuffer()
  );

  const isJpeg =
    head[0] === 0xff &&
    head[1] === 0xd8 &&
    head[2] === 0xff;

  const isPng =
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e;

  const isGif =
    head[0] === 0x47 &&
    head[1] === 0x49 &&
    head[2] === 0x46;

  const isWebm =
    head[0] === 0x1a &&
    head[1] === 0x45 &&
    head[2] === 0xdf;

  const isFtyp =
    head.length >= 12 &&
    head[4] === 0x66 &&
    head[5] === 0x74 &&
    head[6] === 0x79 &&
    head[7] === 0x70;

  if (isJpeg) {
    return {
      kind: "image",
      mimeType: "image/jpeg",
    };
  }

  if (isPng) {
    return {
      kind: "image",
      mimeType: "image/png",
    };
  }

  if (isGif) {
    return {
      kind: "image",
      mimeType: "image/gif",
    };
  }

  if (isWebm) {
    return {
      kind: "video",
      mimeType: "video/webm",
    };
  }

  if (isFtyp) {
    // Container for both HEIC photos and
    // mp4/mov videos — trust the name.
    if (VIDEO_EXTS.has(ext)) {
      return {
        kind: "video",
        mimeType: "video/mp4",
      };
    }

    return {
      kind: "image",
      mimeType: "image/heic",
    };
  }

  return null;
}

/**
 * Upload one photo or video to the user's
 * folder. Returns { url, mediaType }.
 */
export async function uploadMedia(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const media = await classifyMedia(file);

  if (!media) {
    throw new Error(
      "Unsupported file. Use photos (JPG, PNG, WebP, GIF, HEIC) or videos (MP4, MOV, WebM)."
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  let outFile = file;
  let mimeType = media.mimeType;

  if (media.kind === "image") {
    const normalized =
      await normalizeImageFile(file);

    outFile = normalized.file;
    mimeType = normalized.mimeType;
  } else if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      "Video is too large. Maximum size is 50 MB."
    );
  }

  const ext = guessExtension(mimeType);

  const fileName = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("moment-images")
    .upload(fileName, outFile, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    if (error.message?.includes("size")) {
      throw new Error(
        media.kind === "video"
          ? "Video is too large. Maximum size is 50 MB."
          : "Image is too large. Maximum size is 10 MB."
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

  return {
    url: publicUrl,
    mediaType: media.kind,
  };
}

/**
 * Add one or many photos/videos to the
 * story's wall. Returns the created rows.
 */
export async function addGalleryMedia(files) {
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
    const { url, mediaType } =
      await uploadMedia(file);

    const { data, error } = await supabase
      .from("gallery_photos")
      .insert({
        story_id: story.id,
        added_by: user.id,
        image_url: url,
        media_type: mediaType,
      })
      .select(
        "id, image_url, media_type, added_by, created_at"
      )
      .single();

    if (error) {
      // Don't leave orphaned storage files
      // behind on a failed insert.
      await deleteImage(url);

      throw error;
    }

    created.push(data);
  }

  return created;
}

export async function getGalleryMedia() {
  const story = await getMyStory();

  if (!story) return [];

  const { data, error } = await supabase
    .from("gallery_photos")
    .select(
      "id, image_url, media_type, added_by, created_at"
    )
    .eq("story_id", story.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Rows created before media_type existed
  // are photos.
  return (data || []).map((row) => ({
    ...row,
    media_type: row.media_type || "image",
  }));
}

export async function deleteGalleryMedia(item) {
  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", item.id);

  if (error) throw error;

  await deleteImage(item.image_url);
}
