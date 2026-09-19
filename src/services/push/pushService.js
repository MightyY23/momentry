import { supabase } from "../supabase/supabaseClient";

//----------------------------------------
// Web push — browser notifications for
// chat messages and occasion reminders.
//
// The VAPID public key is safe to embed
// (it identifies the server, it is not a
// secret). The private key lives in the
// Edge Function environment.
//----------------------------------------

// Resolved at runtime from the push Edge
// Function's GET endpoint — no build-time
// env var needed. (A VITE_VAPID_PUBLIC_KEY
// override still wins if it is set.)
let cachedPublicKey =
  import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

let keyPromise = null;

function urlBase64ToUint8Array(
  base64String
) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(base64);

  return Uint8Array.from(
    [...raw].map((c) =>
      c.charCodeAt(0)
    )
  );
}

async function getVapidPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;

  if (!keyPromise) {
    keyPromise = (async () => {
      // verify_jwt is on, so the GET needs the
      // caller's session token too.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push`,
        {
          headers: {
            apikey:
              import.meta.env
                .VITE_SUPABASE_ANON_KEY,

            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
        }
      );

      const data = await res.json();

      if (!data?.publicKey) {
        throw new Error(
          "Push isn't configured on the server yet."
        );
      }

      cachedPublicKey = data.publicKey;

      return cachedPublicKey;
    })();
  }

  return keyPromise;
}

export function pushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * True when the server has VAPID keys set
 * (the push function can actually send).
 * Used by UI to hide/soften notification
 * prompts until setup:push has been run.
 */
export async function isPushServerConfigured() {
  try {
    await getVapidPublicKey();

    return true;
  } catch {
    return false;
  }
}

export async function getPushPermission() {
  if (!pushSupported()) return "unsupported";

  return Notification.permission;
}

/**
 * Ask permission + subscribe this device.
 * Stores the subscription row for the
 * Edge Function to fan out to.
 */
export async function enablePush() {
  if (!pushSupported()) {
    throw new Error(
      "Push isn't supported on this device."
    );
  }

  const vapidPublicKey =
    await getVapidPublicKey();

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was denied."
    );
  }

  const reg =
    await navigator.serviceWorker.ready;

  const existing =
    await reg.pushManager.getSubscription();

  const subscription =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,

      applicationServerKey:
        urlBase64ToUint8Array(vapidPublicKey),
    }));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const json = subscription.toJSON();

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,

        endpoint: json.endpoint,

        keys: json.keys,

        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

  if (error) throw error;

  return true;
}

export async function disablePush() {
  const reg =
    await navigator.serviceWorker.ready;

  const sub =
    await reg.pushManager.getSubscription();

  if (!sub) return;

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", sub.endpoint);

  await sub.unsubscribe();
}

//----------------------------------------
// Partner alerts — call after inserting a
// chat message. Fire-and-forget: chat must
// never wait on (or fail because of) push.
// The Edge Function verifies the caller's
// JWT + story membership, so the anon key
// in the browser is all we need here.
//----------------------------------------

export async function notifyPartner({
  storyId,
  senderId,
  title,
  body,
  url = "/chat",
  isNote = false,
}) {
  if (!storyId || !senderId) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${session?.access_token ?? ""}`,

          apikey:
            import.meta.env.VITE_SUPABASE_ANON_KEY,
        },

        body: JSON.stringify({
          kind: "chat",

          storyId,

          senderId,

          title,

          body,

          url,

          isNote,
        }),
      }
    );
  } catch {
    /* push is best-effort */
  }
}
