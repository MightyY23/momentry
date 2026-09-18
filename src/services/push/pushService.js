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

// Set this in a Vercel env var
// (VITE_VAPID_PUBLIC_KEY) generated with:
//   npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

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

export function pushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
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
      "Push isn't supported on this device or the server key is missing."
    );
  }

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
        urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY
        ),
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
