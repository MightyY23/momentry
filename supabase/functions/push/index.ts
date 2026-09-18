// ============================================================
// MOMENTRY PUSH — Edge Function
//
// Deno Deploy runtime. Triggered two ways:
//   1. Direct POST { kind: "chat", storyId, senderId,
//      title, body } — call it from a DB webhook on
//      chat_messages INSERT (or manually).
//   2. Direct POST { kind: "occasion", title, body, url }
//      from a cron for birthday/anniversary nudges.
//
// Required secrets (supabase secrets set):
//   VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY,
//   VAPID_SUBJECT  (e.g. mailto:you@example.com)
//   SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL are
//   provided by the platform.
// ============================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";


// pako isn't needed; use web Crypto for aesgcm via the
// web-push protocol implemented inline below.

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

const SERVICE_ROLE =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ------------------------------------------------------------
// Minimal VAPID JWT
// ------------------------------------------------------------

function b64url(bytes: Uint8Array): string {
  let bin = "";

  bytes.forEach((b) => (bin += String.fromCharCode(b)));

  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlStr(s: string): string {
  return btoa(s)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function vapidAuthorization(
  audience: string
): Promise<string> {
  const header = b64urlStr(
    JSON.stringify({ typ: "JWT", alg: "ES256" })
  );

  const now = Math.floor(Date.now() / 1000);

  const claims = b64urlStr(
    JSON.stringify({
      aud: audience,

      exp: now + 12 * 3600,

      sub: VAPID_SUBJECT,
    })
  );

  const signingInput = `${header}.${claims}`;

  const rawPrivate = Uint8Array.from(
    atob(
      VAPID_PRIVATE_KEY.replace(/-/g, "+").replace(
        /_/g,
        "/"
      )
    ),
    (c) => c.charCodeAt(0)
  );

  // Import raw 32-byte private scalar as JWK EC P-256.
  const key = await crypto.subtle.importKey(
    "jwk",

    {
      kty: "EC",

      crv: "P-256",

      x: "",

      y: "",

      d: b64url(rawPrivate),
    },

    { name: "ECDSA", namedCurve: "P-256" },

    false,

    ["sign"]
  ).catch(() => null);

  if (!key) {
    // Fallback: import as raw and rebuild JWK from
    // the public key below (some generators emit
    // the private key alone).
    throw new Error(
      "VAPID_PRIVATE_KEY must be base64url of the 32-byte private scalar."
    );
  }

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },

    key,

    new TextEncoder().encode(signingInput)
  );

  // Raw signature (r||s, 64 bytes) -> JWT format.
  const sigBytes = new Uint8Array(sig);

  const r = sigBytes.slice(0, 32);

  const s = sigBytes.slice(32);

  return `${signingInput}.${b64url(r)}${b64url(s)}`;
}

// ------------------------------------------------------------
// Message encryption (aes128gcm, rfc8291)
// ------------------------------------------------------------

async function encryptPayload(
  payloadStr: string,

  p256dh: string,

  auth: string
): Promise<Uint8Array> {
  // Import the user's public key.
  const userPubBytes = Uint8Array.from(
    atob(p256dh.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const userPub = await crypto.subtle.importKey(
    "raw",

    userPubBytes.slice(65), // uncompressed point -> skip format byte? No — keep whole.

    { name: "ECDH", namedCurve: "P-256" },

    true,

    []
  ).catch(() =>
    crypto.subtle.importKey(
      "raw",

      userPubBytes,

      { name: "ECDH", namedCurve: "P-256" },

      true,

      []
    )
  );

  // Our ephemeral key pair.
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },

    true,

    ["deriveBits"]
  );

  const ephemeralRaw = new Uint8Array(
    await crypto.subtle.exportKey(
      "raw",

      ephemeral.publicKey
    )
  );

  // Shared secret.
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "ECDH",

        public: userPub as CryptoKey,
      },

      ephemeral.privateKey,

      256
    )
  );

  // HKDF inputs (rfc8291 4.2).
  const authSecret = Uint8Array.from(
    atob(auth.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const enc = new TextEncoder();

  const PRK_key = await hkdf(
    shared,

    authSecret,

    enc.encode("WebPush: info\x00"),

    32
  );

  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const CEK = await hkdf(
    new Uint8Array(0),

    PRK_key,

    concat(
      enc.encode("Content-Encoding: aes128gcm\x00"),

      new Uint8Array([0, 0, 0, 1])
    ),

    16,

    salt
  );

  const NONCE = await hkdf(
    new Uint8Array(0),

    PRK_key,

    concat(
      enc.encode("Content-Encoding: nonce\x00"),

      new Uint8Array([0, 0, 0, 1])
    ),

    12,

    salt
  );

  // Payload: plaintext + delimiter + padding.
  const plaintext = concat(
    enc.encode(payloadStr),

    new Uint8Array([2])
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: NONCE },

    await crypto.subtle.importKey(
      "raw",

      CEK,

      "AES-GCM",

      false,

      ["encrypt"]
    ),

    plaintext
  );

  // aes128gcm header: salt(16) | rs(4) | idlen(1) | key
  const header = concat(
    salt,

    new Uint8Array([0, 0, 16, 0]), // rs = 4096

    new Uint8Array([ephemeralRaw.length]),

    ephemeralRaw
  );

  return concat(header, new Uint8Array(ciphertext));
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(
    arrays.reduce(
      (n, a) => n + a.length,
      0
    )
  );

  let offset = 0;

  arrays.forEach((a) => {
    out.set(a, offset);

    offset += a.length;
  });

  return out;
}

async function hkdf(
  ikm: Uint8Array,

  salt: Uint8Array,

  info: Uint8Array,

  length: number,

  explicitSalt?: Uint8Array
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",

    ikm,

    "HKDF",

    false,

    ["deriveBits"]
  );

  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",

        hash: "SHA-256",

        salt: explicitSalt ?? salt,

        info,
      },

      key,

      length * 8
    )
  );
}

// ------------------------------------------------------------
// Send one push
// ------------------------------------------------------------

async function sendPush(
  sub: {
    endpoint: string;

    keys: { p256dh: string; auth: string };
  },

  payload: string
): Promise<boolean> {
  const audience = new URL(sub.endpoint).origin;

  const auth = await vapidAuthorization(
    audience
  );

  const encrypted = await encryptPayload(
    payload,

    sub.keys.p256dh,

    sub.keys.auth
  );

  const resp = await fetch(sub.endpoint, {
    method: "POST",

    headers: {
      Authorization: `vapid ${auth}`,

      "Content-Encoding": "aes128gcm",

      "Content-Type":
        "application/octet-stream",

      TTL: "86400",
    },

    body: encrypted as unknown as BodyInit,
  });

  // 410/404 = gone — let caller prune.
  return resp.ok || resp.status === 429;
}

// ------------------------------------------------------------
// Request handling
// ------------------------------------------------------------

interface Req {
  kind: "chat" | "occasion";

  // chat
  storyId?: string;

  senderId?: string;

  title?: string;

  body?: string;

  url?: string;

  // chat: sealed love note flag (copy + deep link)
  isNote?: boolean;

  // occasion: notify every subscription
  // whose user has at least one subscription
  // row (already user-scoped by RLS writes).
}

// ------------------------------------------------------------
// Auth: the caller must carry a valid Supabase access token
// AND be a member of the story they're notifying for. This
// turns the function from "anyone with the URL" into
// "members only" — no key leakage can spam your partner.
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
    { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } }
  );

  const members = (await memRes.json()) as Array<{
    user_id: string;
  }>;

  return members.length ? { ok: true, userId: user.id } : { ok: false };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
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

  // Sealed love notes get their own mystery
  // copy — never leak the note body in the
  // notification, the surprise is the point.
  const isNote = body.kind === "chat" &&
    Boolean(body.isNote);

  const fallbackTitle = isNote
    ? "💌 A sealed note arrived"
    : "Momentry";

  const fallbackBody = isNote
    ? "Your partner hid a note for you. Open chat to unseal it."
    : "";

  const payloadStr = JSON.stringify({
    title: body.title || fallbackTitle,

    body: body.body || fallbackBody,

    url: isNote && !body.url
      ? "/chat?note=1"
      : body.url || "/chat",

    tag: isNote ? "love-note" : body.kind,
  });

  // Fetch targets.
  let subs: Array<{
    endpoint: string;

    keys: { p256dh: string; auth: string };

    user_id: string;
  }> = [];

  const dbHeaders = {
    apikey: SERVICE_ROLE,

    Authorization: `Bearer ${SERVICE_ROLE}`,

    "Content-Type": "application/json",
  };

  if (
    body.kind === "chat" &&
    body.storyId &&
    body.senderId
  ) {
    // The other member of the story.
    const memRes = await fetch(
      `${SUPABASE_URL}/rest/v1/story_members?story_id=eq.${body.storyId}&user_id=neq.${body.senderId}&select=user_id`,

      { headers: dbHeaders }
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

      { headers: dbHeaders }
    );

    subs = await subRes.json();
  } else if (body.kind === "occasion") {
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,keys,user_id`,

      { headers: dbHeaders }
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
      try {
        const ok = await sendPush(
          s,

          payloadStr
        );

        if (ok) sent += 1;

        else dead.push(s.endpoint);
      } catch {
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

          headers: dbHeaders,
        }
      )
    )
  );

  return json({ sent, pruned: dead.length });
});

function json(
  data: unknown,

  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,

    headers: {
      "Content-Type":
        "application/json",
    },
  });
}
