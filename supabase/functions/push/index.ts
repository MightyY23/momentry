// ============================================================
// MOMENTRY PUSH — Edge Function
//
// POST { kind: "chat", storyId, senderId?, title,
//        body, url?, isNote? }
//   → notifies the story's OTHER member(s).
//     Caller must carry a valid Supabase JWT and
//     be a member of the story (server-verified).
//
// POST { kind: "occasion", title, body, url? }
//   → reserved for cron nudges (called with the
//     service role key).
//
// Required secrets (supabase secrets set):
//   VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY,
//   VAPID_SUBJECT  (e.g. mailto:you@example.com)
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
//   provided by the platform.
//
// Uses the web-push npm package instead of
// hand-rolled crypto — the previous inline
// aes128gcm implementation never produced a
// valid subscription push (0 deliveries).
// ============================================================

import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get(
  "VAPID_PUBLIC_KEY"
) ?? "";

const VAPID_PRIVATE_KEY = Deno.env.get(
  "VAPID_PRIVATE_KEY"
) ?? "";

const VAPID_SUBJECT = Deno.env.get(
  "VAPID_SUBJECT"
) ?? "mailto:alerts@momentry.app";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";

// Browser calls this function cross-origin
// (app → *.supabase.co). Without these
// headers the preflighted fetch dies before
// reaching the function — which silently
// killed every client notification.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SERVICE_ROLE =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

let vapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  vapidConfigured = true;
}

function json(
  data: unknown,

  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,

    headers: {
      ...corsHeaders,

      "Content-Type": "application/json",
    },
  });
}

// ------------------------------------------------------------
// Auth: the caller must carry a valid Supabase access token
// AND be a member of the story they're notifying for.
// ------------------------------------------------------------

async function assertStoryMember(
  req: Request,
  storyId: string
): Promise<{ ok: boolean; userId?: string }> {
  const authHeader =
    req.headers.get("Authorization") ?? "";

  const token = authHeader.replace(
    /^Bearer\s+/i,
    ""
  );

  if (!token) return { ok: false };

  const authRes = await fetch(
    `${SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        apikey: SERVICE_ROLE,

        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!authRes.ok) return { ok: false };

  const user = (await authRes.json()) as {
    id?: string;
  };

  if (!user.id) return { ok: false };

  const memRes = await fetch(
    `${SUPABASE_URL}/rest/v1/story_members?story_id=eq.${storyId}&user_id=eq.${user.id}&select=user_id`,
    {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
    }
  );

  const members = (await memRes.json()) as Array<{
    user_id: string;
  }>;

  return members.length
    ? { ok: true, userId: user.id }
    : { ok: false };
}

interface Req {
  kind: "chat" | "occasion";

  // chat
  storyId?: string;

  senderId?: string;

  title?: string;

  body?: string;

  url?: string;

  // chat: sealed love note flag (mystery copy)
  isNote?: boolean;
}

// Deno's fetch can't stream a Node Readable —
// buffer the encrypted payload first.
async function sendOne(
  sub: {
    endpoint: string;

    keys: { p256dh: string; auth: string };
  },

  payload: string
): Promise<"sent" | "gone" | "retry" | "fail"> {
  try {
    const result = await webpush.sendNotification(
      {
        endpoint: sub.endpoint,

        keys: {
          p256dh: sub.keys.p256dh,

          auth: sub.keys.auth,
        },
      },

      payload,

      { TTL: 86400 }
    );

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return "sent";
    }

    return result.statusCode === 429
      ? "retry"
      : "fail";
  } catch (e) {
    const statusCode =
      (e as { statusCode?: number }).statusCode;

    // 404/410 = subscription gone — prune it.
    if (statusCode === 404 || statusCode === 410) {
      return "gone";
    }

    console.error(
      "push send failed:",
      statusCode,
      (e as Error)?.message?.slice(0, 200)
    );

    return "fail";
  }
}

const serviceHeaders = {
  apikey: SERVICE_ROLE,

  Authorization: `Bearer ${SERVICE_ROLE}`,
};

Deno.serve(async (req) => {
  // Preflight — the gateway skips JWT
  // validation for OPTIONS, so browsers can
  // complete their CORS handshake.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,

      headers: corsHeaders,
    });
  }

  // GET: hand the app the VAPID public key so
  // clients can subscribe without a build-time
  // env var (public keys are safe to expose —
  // they identify the server, nothing more).
  if (req.method === "GET") {
    return json({
      configured: vapidConfigured,

      publicKey: vapidConfigured
        ? VAPID_PUBLIC_KEY
        : null,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  if (!vapidConfigured) {
    return json(
      {
        error:
          "Push isn't configured (missing VAPID secrets).",
      },

      503
    );
  }

  let body: Req;

  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }

  if (
    body.kind === "chat" &&
    body.storyId
  ) {
    const gate = await assertStoryMember(
      req,
      body.storyId
    );

    if (!gate.ok) {
      return json(
        { error: "Not a story member" },

        403
      );
    }

    // Server-side identity wins over the body.
    body.senderId = gate.userId;
  }

  // Sealed love notes get mystery copy —
  // never leak the note body in the
  // notification; the surprise is the point.
  const isNote =
    body.kind === "chat" && Boolean(body.isNote);

  const fallbackTitle = isNote
    ? "💌 A sealed note arrived"
    : "Momentry";

  const fallbackBody = isNote
    ? "Your partner hid a note for you. Open chat to unseal it."
    : "";

  const payloadStr = JSON.stringify({
    title: body.title || fallbackTitle,

    body: body.body || fallbackBody,

    url:
      isNote && !body.url
        ? "/chat?note=1"
        : body.url || "/chat",

    tag: isNote ? "love-note" : body.kind,
  });

  // Fetch targets.
  let subs: Array<{
    endpoint: string;

    keys: { p256dh: string; auth: string };
  }> = [];

  if (
    body.kind === "chat" &&
    body.storyId &&
    body.senderId
  ) {
    // The other member(s) of the story.
    const memRes = await fetch(
      `${SUPABASE_URL}/rest/v1/story_members?story_id=eq.${body.storyId}&user_id=neq.${body.senderId}&select=user_id`,
      { headers: serviceHeaders }
    );

    const members = await memRes.json();

    const targetIds = (
      members as Array<{ user_id: string }>
    ).map((m) => m.user_id);

    if (!targetIds.length) {
      return json({ sent: 0 });
    }

    const inQuery = `user_id=in.(${targetIds.join(
      ","
    )})`;

    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?${inQuery}&select=endpoint,keys,user_id`,
      { headers: serviceHeaders }
    );

    subs = await subRes.json();
  } else if (body.kind === "occasion") {
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,keys,user_id`,
      { headers: serviceHeaders }
    );

    subs = await subRes.json();
  } else {
    return json(
      { error: "Unknown kind or missing fields" },

      400
    );
  }

  let sent = 0;

  const dead: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      const result = await sendOne(s, payloadStr);

      if (result === "sent") {
        sent += 1;
      } else if (result === "gone") {
        dead.push(s.endpoint);
      }
    })
  );

  // Prune dead endpoints.
  await Promise.all(
    dead.map((endpoint) =>
      fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(
          endpoint
        )}`,
        {
          method: "DELETE",

          headers: serviceHeaders,
        }
      )
    )
  );

  return json({ sent, pruned: dead.length });
});
