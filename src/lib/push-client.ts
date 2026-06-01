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

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  // Fast path
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  // If not registered yet (e.g. user clicked before window.load), register now.
  try {
    const reg = await withTimeout(
      navigator.serviceWorker.register("/sw.js", { scope: "/" }),
      8000,
      "SW register"
    );
    return reg;
  } catch (e) {
    console.error("[push] SW register failed", e);
    return null;
  }
}

export type SubscribeResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "unsupported"
        | "ios-needs-install"
        | "no-vapid"
        | "permission-denied"
        | "no-service-worker"
        | "subscribe-failed"
        | "server-error";
      message: string;
    };

/**
 * Ask the user for permission, register with the push manager, and persist
 * the subscription on the server. Returns a structured result so UI can show
 * the actual reason on failure.
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!pushSupported()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Энэ browser push дэмждэггүй",
    };
  }

  // iOS Safari only allows push when installed as PWA (Add to Home Screen)
  if (isIos() && !isStandalone()) {
    return {
      ok: false,
      reason: "ios-needs-install",
      message: "iPhone дээр Share → Add to Home Screen хийгээд апп-аас идэвхжүүлнэ үү",
    };
  }

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) {
    console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY олдсонгүй");
    return {
      ok: false,
      reason: "no-vapid",
      message: "Серверийн VAPID түлхүүр тохируулагдаагүй байна",
    };
  }

  let perm: NotificationPermission;
  try {
    // Most browsers resolve immediately when user clicks Allow/Block; 60s is
    // generous for slow users. Without a timeout, if the popup is dismissed
    // without a choice (rare bug on some browsers) we'd hang forever.
    perm = await withTimeout(
      Promise.resolve(Notification.requestPermission()),
      60_000,
      "permission"
    );
  } catch (e) {
    console.error("[push] requestPermission threw", e);
    return {
      ok: false,
      reason: "permission-denied",
      message: "Notification зөвшөөрөл авч чадсангүй",
    };
  }
  if (perm !== "granted") {
    return {
      ok: false,
      reason: "permission-denied",
      message:
        perm === "denied"
          ? "Notification хаагдсан байна. Browser-ийн тохиргооноос зөвшөөрнө үү"
          : "Зөвшөөрөл өгөгдсөнгүй",
    };
  }

  const reg = await getRegistration();
  if (!reg) {
    return {
      ok: false,
      reason: "no-service-worker",
      message: "Service worker бэлэн биш байна. Хуудсыг refresh хийгээд дахин оролдоно уу",
    };
  }

  let sub: PushSubscription | null;
  try {
    sub = await withTimeout(reg.pushManager.getSubscription(), 5000, "getSubscription");
    if (!sub) {
      sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        }),
        15_000,
        "pushManager.subscribe"
      );
    }
  } catch (e) {
    console.error("[push] pushManager.subscribe failed", e);
    return {
      ok: false,
      reason: "subscribe-failed",
      message: e instanceof Error ? e.message : "Push subscribe амжилтгүй",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        reason: "server-error",
        message: data.error || `Серверийн алдаа (${res.status})`,
      };
    }
  } catch (e) {
    return {
      ok: false,
      reason: "server-error",
      message: e instanceof Error ? e.message : "Сүлжээний алдаа",
    };
  }

  return { ok: true };
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
