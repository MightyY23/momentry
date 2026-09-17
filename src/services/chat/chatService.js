import { supabase } from "../supabase/supabaseClient";

//----------------------------------------
// Partner chat — a private thread for the
// two people sharing a story. RLS keeps
// the thread visible only to story
// members; realtime delivers new messages
// to both partners without reloads.
//----------------------------------------

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Load the story's chat history, oldest
 * first. Returns rows with sender profile
 * basics for rendering.
 */
export async function getChatMessages(storyId) {
  if (!storyId) return [];

  const {
    data,
    error,
  } = await supabase
    .from("chat_messages")
    .select(
      `
      id,
      story_id,
      sender_id,
      body,
      image_url,
      kind,
      duration_ms,
      reactions,
      seen_at,
      created_at
    `
    )
    .eq("story_id", storyId)
    .order("created_at", {
      ascending: true,
    })
    .limit(500);

  if (error) throw error;

  return data || [];
}

/**
 * Validate + send one message. Emoji-safe
 * (code-point length). Returns the stored
 * row.
 */
export async function sendChatMessage(
  storyId,
  body,
  imageUrl = null,
  kind = "text",
  durationMs = null
) {
  const trimmed = (body || "").trim();

  if (!storyId) {
    throw new Error("No story to chat in.");
  }

  if (!trimmed && !imageUrl) {
    throw new Error(
      "Write a message or attach a photo."
    );
  }

  if ([...trimmed].length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Message is too long — keep it under ${MAX_MESSAGE_LENGTH} characters.`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      story_id: storyId,
      sender_id: user.id,
      body: trimmed,
      image_url: imageUrl,
      kind,
      duration_ms: durationMs,
    })
    .select(
      "id, story_id, sender_id, body, image_url, kind, duration_ms, reactions, seen_at, created_at"
    )
    .single();

  if (error) throw error;

  return data;
}

/**
 * Live updates — fires onInsert for every
 * new message in the story's thread, on
 * both partners' devices. Returns an
 * unsubscribe function.
 */
export function subscribeToChat(
  storyId,
  { onInsert } = {}
) {
  if (!storyId) return () => {};

  // Unique name per subscriber — supabase
  // channels are singletons by name, and a
  // second .on() on an already-subscribed
  // channel throws. Both the Navbar dot
  // and the Chat page listen at once.
  const channel = supabase
    .channel(
      `chat-${storyId}-${Math.random()
        .toString(36)
        .slice(2, 8)}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `story_id=eq.${storyId}`,
      },
      (payload) => onInsert?.(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

//----------------------------------------
// Instagram-style extras: reactions,
// seen receipts, voice notes, typing.
//----------------------------------------

export const REACTION_EMOJIS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "🔥",
];

/**
 * Toggle the current user's reaction on
 * a message. Pass the whole reactions
 * object after local mutation.
 */
export async function setReaction(
  messageId,
  reactions
) {
  const { error } = await supabase
    .from("chat_messages")
    .update({ reactions })
    .eq("id", messageId);

  if (error) throw error;
}

/**
 * Mark every unseen message from the
 * partner as seen (read receipt).
 */
export async function markThreadSeen(
  storyId,
  myUserId
) {
  const { error } = await supabase
    .from("chat_messages")
    .update({ seen_at: new Date().toISOString() })
    .eq("story_id", storyId)
    .neq("sender_id", myUserId)
    .is("seen_at", null);

  if (error) {
    console.warn("markThreadSeen:", error);
  }
}

/**
 * Send a voice note: upload the audio,
 * then insert a message of kind 'voice'.
 */
export async function sendVoiceNote(
  storyId,
  blob,
  durationMs
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in.");

  const ext =
    blob.type.includes("ogg") ? "ogg" : "webm";

  const path = `${user.id}/voice-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("moment-images")
    .upload(path, blob, {
      contentType:
        blob.type || `audio/${ext}`,
      upsert: false,
    });

  if (upErr) throw upErr;

  const { data: { publicUrl } } =
    supabase.storage
      .from("moment-images")
      .getPublicUrl(path);

  return sendChatMessage(
    storyId,
    "",
    publicUrl,
    "voice",
    durationMs
  );
}

/**
 * Typing indicator — a tiny realtime
 * broadcast (no database rows).
 */
export function subscribeToTyping(
  storyId,
  myUserId,
  onPartnerTyping
) {
  if (!storyId) return () => {};

  const channel = supabase.channel(
    `typing-${storyId}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
  );

  channel
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      if (
        payload?.userId &&
        payload.userId !== myUserId
      ) {
        onPartnerTyping(Boolean(payload.typing));
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function broadcastTyping(
  storyId,
  myUserId,
  typing
) {
  if (!storyId) return;

  // Reuse the send path's client — a
  // lightweight ephemeral channel.
  const channel = supabase.channel(
    `typing-${storyId}-send`
  );

  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId: myUserId, typing },
  });
}
