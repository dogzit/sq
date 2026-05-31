/**
 * Browser-side helpers for managing the user's Web Push subscription.
 * Requires the project's existing `/sw.js` service worker (already registered
 * by RootLayout) and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var.
 */

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  // Prefer the active sw.js registration; fall back to ready
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (reg) return reg;
  return navigator.serviceWorker.ready.catch(() => null);
}

/**
 * Ask the user for permission, register with the push manager, and persist
 * the subscription on the server. Returns true on success.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) {
    console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY олдсонгүй");
    return false;
  }

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await getRegistration();
  if (!reg) return false;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  return res.ok;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await getRegistration();
  if (!reg) return false;

  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;

  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
  return true;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}
