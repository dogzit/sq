// Custom service worker additions
// This file is injected by next-pwa into the generated service worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline") || new Response(
          "<html><body style='background:#0a0a0f;color:#00f0ff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace'><div style='text-align:center'><h1>OFFLINE</h1><p>Check your connection</p></div></body></html>",
          { headers: { "Content-Type": "text/html" } }
        );
      })
    );
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "SideQuest";
  const options = {
    body: data.body || "You have a new quest!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
