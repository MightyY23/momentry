/* ==========================================================
   MOMENTRY SERVICE WORKER
   - App shell + assets: stale-while-revalidate
   - Navigations: network-first with offline shell
     fallback (never caches API/Supabase calls)
   ========================================================== */

const VERSION = "momentry-v1";

const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Never intercept API / auth / storage traffic.
  if (
    url.origin !== self.location.origin ||
    url.hostname.includes("supabase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic")
  ) {
    return;
  }

  // Page navigations: network first, offline
  // shell as fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(VERSION)
            .then((cache) =>
              cache.put("/index.html", copy)
            );

          return response;
        })
        .catch(() =>
          caches.match("/index.html")
        )
    );

    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches
              .open(VERSION)
              .then((cache) =>
                cache.put(request, copy)
              );
          }

          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

/* ==========================================================
   WEB PUSH — chat messages + occasion
   reminders. Shows the notification when
   the app is in the background.
   ========================================================== */

self.addEventListener("push", (event) => {
  let data;

  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || "" };
  }

  const title =
    data.title || "Momentry";

  const options = {
    body: data.body || "You have a new message 💕",

    icon: "/icons/icon-192.png",

    badge: "/icons/icon-192.png",

    tag: data.tag || "momentry",

    data: { url: data.url || "/chat" },

    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const url =
      event.notification.data?.url || "/chat";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((list) => {
          for (const client of list) {
            if (
              "focus" in client
            ) {
              client.navigate(url);

              return client.focus();
            }
          }

          return self.clients.openWindow(url);
        })
    );
  }
);
