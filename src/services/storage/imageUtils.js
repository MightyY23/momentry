import { supabase } from "../supabase/supabaseClient";

//----------------------------------------
// Image normalization pipeline
//
// Fixes the two real-world photo-upload
// bugs on phones:
//  1. Pickers (iOS HEIC, some Android
//     share sheets) deliver files with an
//     empty or wrong MIME `type` — we now
//     sniff the actual bytes instead.
//  2. Phone cameras produce 3-8 MB images
//     that fail server limits — we
//     re-encode to a bounded size client-
//     side before uploading.
//----------------------------------------

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB raw cap

const MAX_DIMENSION = 2048; // px

const OUTPUT_QUALITY = 0.86;

function sniffImageType(bytes) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }

  if (bytes.length >= 12) {
    const brand = String.fromCharCode(
      bytes[8],
      bytes[9],
      bytes[10],
      bytes[11]
    );

    if (brand === "ftyp") {
      return "image/heic";
    }
  }

  return null;
}

export async function sniffFileImageType(file) {
  const head = new Uint8Array(
    await file.slice(0, 32).arrayBuffer()
  );

  return sniffImageType(head);
}

function isReencodableImage(mimeType) {
  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp" ||
    mimeType === "image/heic" ||
    mimeType === "image/heif"
  );
}

function drawScaled(img, maxDim) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const scale = Math.min(1, maxDim / Math.max(width, height));

  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  canvas
    .getContext("2d")
    .drawImage(img, 0, 0, w, h);

  return canvas;
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Encoding failed")),
      "image/jpeg",
      quality
    );
  });
}

/**
 * Normalize any picked image into something
 * the storage bucket accepts:
 *   - GIFs pass through (animation kept)
 *   - HEIC/HEIF or files > 2 MB are decoded
 *     and re-encoded to JPEG <= 2048px
 *   - everything else passes through as-is
 *
 * Throws a user-friendly Error when the
 * input isn't an image at all.
 */
export async function normalizeImageFile(file) {
  if (!file) {
    throw new Error("No image selected.");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      "Image is too large. Maximum size is 10 MB."
    );
  }

  const sniffed = await sniffFileImageType(file);

  if (!sniffed) {
    throw new Error(
      "That doesn't look like a supported image. Use JPG, PNG, WebP, GIF or HEIC."
    );
  }

  if (sniffed === "image/gif") {
    return { file, mimeType: "image/gif", reencoded: false };
  }

  if (!isReencodableImage(sniffed)) {
    throw new Error("Unsupported image format.");
  }

  const needsReencode =
    sniffed === "image/heic" ||
    sniffed === "image/heif" ||
    file.size > 2 * 1024 * 1024;

  if (!needsReencode) {
    return { file, mimeType: sniffed, reencoded: false };
  }

  let objectUrl = null;

  try {
    objectUrl = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("decode failed"));
      el.src = objectUrl;
    });

    const canvas = drawScaled(img, MAX_DIMENSION);
    const blob = await canvasToBlob(
      canvas,
      OUTPUT_QUALITY
    );

    const out = new File([blob], "photo.jpg", {
      type: "image/jpeg",
    });

    return {
      file: out,
      mimeType: "image/jpeg",
      reencoded: true,
    };
  } catch (err) {
    // The browser can't natively decode HEIC —
    // fall back to the original file and let
    // the server accept or reject it.
    if (
      sniffed === "image/heic" ||
      sniffed === "image/heif"
    ) {
      return {
        file,
        mimeType: sniffed,
        reencoded: false,
      };
    }

    throw new Error(
      "Couldn't process that image. Try a different photo.",
      { cause: err }
    );
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export function guessExtension(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

/**
 * One-call upload: normalize, then push to
 * the user's own storage folder. Throws
 * user-friendly errors.
 */
export async function uploadNormalizedImage(file) {
  const {
    file: outFile,
    mimeType,
  } = await normalizeImageFile(file);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "You need to be signed in to upload images."
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
