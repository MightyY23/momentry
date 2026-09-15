import { supabase } from "../supabase/supabaseClient";
import { uploadImage } from "../storage/uploadImage";

//----------------------------------------
// Validation
//----------------------------------------

const MAX_MESSAGE_LENGTH = 2000;

function todayISO() {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now - tz)
    .toISOString()
    .slice(0, 10);
}

export function validateGift({ message, openDate }) {
  if (!message || !message.trim()) {
    return "Write a message for your gift.";
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Message is too long — keep it under ${MAX_MESSAGE_LENGTH} characters.`;
  }

  if (!openDate) {
    return "Pick the day the gift unlocks.";
  }

  if (openDate < todayISO()) {
    return "The unlock day can't be in the past.";
  }

  return null;
}

//----------------------------------------
// Wrap a gift: metadata + sealed content.
// The recipient's row appears on their
// dashboard instantly via realtime.
//----------------------------------------

export async function createGift({
  storyId,
  recipientId,
  occasionKind,
  openDate,
  boxStyle = "rose",
  message,
  photoFile = null,
}) {
  const validationError = validateGift({
    message,
    openDate,
  });

  if (validationError) {
    throw new Error(validationError);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be signed in.");
  }

  if (!storyId || !recipientId) {
    throw new Error(
      "Missing story or recipient for the gift."
    );
  }

  // Upload the photo FIRST — a failed upload
  // must not leave a half-wrapped gift.
  let photoUrl = null;

  if (photoFile) {
    photoUrl = await uploadImage(photoFile);
  }

  const { data: gift, error: giftError } =
    await supabase
      .from("occasion_gifts")
      .insert({
        story_id: storyId,
        sender_id: user.id,
        recipient_id: recipientId,
        occasion_kind: occasionKind,
        open_date: openDate,
        box_style: boxStyle,
      })
      .select()
      .single();

  if (giftError) {
    if (
      giftError.code === "23505" ||
      giftError.message?.includes("duplicate")
    ) {
      throw new Error(
        "You already wrapped a gift for this occasion."
      );
    }

    // Orphaned photo cleanup.
    if (photoUrl) {
      const { deleteImage } = await import(
        "../storage/uploadImage"
      );
      deleteImage(photoUrl);
    }

    throw new Error(
      giftError.message ||
        "Couldn't seal the gift. Please try again."
    );
  }

  const { error: secretError } = await supabase
    .from("occasion_gift_secrets")
    .insert({
      gift_id: gift.id,
      message: message.trim(),
      photo_url: photoUrl,
    });

  if (secretError) {
    // Roll back the box so no empty gift
    // sits sealed forever.
    await supabase
      .from("occasion_gifts")
      .delete()
      .eq("id", gift.id);

    if (photoUrl) {
      const { deleteImage } = await import(
        "../storage/uploadImage"
      );
      deleteImage(photoUrl);
    }

    throw new Error(
      secretError.message ||
        "Couldn't seal the gift. Please try again."
    );
  }

  return gift;
}

//----------------------------------------
// My story's gifts: metadata for everyone,
// content only when unsealed (RLS strips
// secrets until the day).
//----------------------------------------

export async function getStoryGifts(storyId) {
  if (!storyId) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("occasion_gifts")
    .select(
      `
      id,
      story_id,
      sender_id,
      recipient_id,
      occasion_kind,
      open_date,
      box_style,
      sealed_at,
      opened_at,
      occasion_gift_secrets (
        message,
        photo_url
      )
    `
    )
    .eq("story_id", storyId)
    .order("open_date", { ascending: true });

  if (error) {
    throw error;
  }

  // Shape: split into "incoming" (for me) and
  // "wrapped" (by me) with a computed state.
  const gifts = (data ?? []).map((g) => {
    // PostgREST returns an OBJECT for the
    // one-to-one secret embed (gift_id is the
    // PK) — older array shape also handled.
    const rawSecret =
      g.occasion_gift_secrets;

    const secret = Array.isArray(rawSecret)
      ? rawSecret[0] ?? null
      : rawSecret ?? null;

    const openDate = g.open_date;
    const today = todayISO();

    const dayArrived =
      openDate <= today ||
      Boolean(g.opened_at);

    const isMine = g.sender_id === user.id;

    return {
      id: g.id,
      storyId: g.story_id,
      senderId: g.sender_id,
      recipientId: g.recipient_id,
      isMine,
      occasionKind: g.occasion_kind,
      openDate,
      boxStyle: g.box_style,
      sealedAt: g.sealed_at,
      openedAt: g.opened_at,
      isRevealed: Boolean(g.opened_at),
      canOpen: !isMine && dayArrived && !g.opened_at,
      // Content is only present when RLS let it
      // through — otherwise null (still sealed).
      message: dayArrived || isMine ? secret?.message ?? null : null,
      photoUrl: dayArrived || isMine ? secret?.photo_url ?? null : null,
    };
  });

  return gifts;
}

//----------------------------------------
// Unwrap: set opened_at. Idempotent —
// re-calling returns success without error.
//----------------------------------------

export async function markGiftOpened(giftId) {
  const { error } = await supabase
    .from("occasion_gifts")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", giftId)
    .is("opened_at", null);

  // No rows updated = already opened — fine.
  if (error) {
    throw error;
  }

  return true;
}

//----------------------------------------
// Delete an unopened gift (sender only,
// enforced by RLS).
//----------------------------------------

export async function deleteGift(giftId) {
  const { data, error } = await supabase
    .from("occasion_gifts")
    .select(
      "occasion_gift_secrets ( photo_url )"
    )
    .eq("id", giftId)
    .maybeSingle();

  if (error) throw error;

  const { error: deleteError } = await supabase
    .from("occasion_gifts")
    .delete()
    .eq("id", giftId);

  if (deleteError) {
    throw deleteError;
  }

  // Storage cleanup after the row is gone
  // (cascade removes the secret row).
  const rawSecret =
    data?.occasion_gift_secrets;

  const photoUrl = (
    Array.isArray(rawSecret)
      ? rawSecret[0]
      : rawSecret
  )?.photo_url;

  if (photoUrl) {
    const { deleteImage } = await import(
      "../storage/uploadImage"
    );
    deleteImage(photoUrl);
  }

  return true;
}
