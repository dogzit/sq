/// <reference lib="webworker" />

// IMPORTANT: bump this on every deploy that ships breaking client changes.
const CACHE_NAME = "sidequest-v3";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.json",
];

// Install — precache essential assets + take over immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — delete ALL previous caches, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
      // Force open clients to reload once so they pick up new bundles
      const clients = await self.clients.matchAll({ type: "window" });
      for (const c of clients) {
        try { c.navigate(c.url); } catch {}
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Fetch — network-first for everything except a small whitelist of static assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Navigation — network first, offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          caches.match(OFFLINE_URL) ||
          new Response(
            '<html><body style="background:#0a0a0f;color:#7C5CFF;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui"><div style="text-align:center"><h1>Offline</h1><p>Check your connection</p></div></body></html>',
            { headers: { "Content-Type": "text/html" } },
          ),
      ),
    );
    return;
  }

  // Never cache Next.js build artifacts — they get new content-hashed URLs every deploy,
  // but caching them aggressively risks stale bundles across deploys.
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".map")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static images / fonts / manifest — stale-while-revalidate
  if (/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            if (res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // API and everything else — network only
  event.respondWith(fetch(event.request));
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "SideQuest", {
      body: data.body || "You have a new quest!",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/dashboard" },
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" },
      ],
    }),
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});

// Periodic background sync (for future quest refresh)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-quests") {
    event.waitUntil(
      fetch("/api/quests")
        .then((r) => r.json())
        .catch(() => {}),
    );
  }
});
