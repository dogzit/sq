import webpush from "web-push";
import { prisma } from "@/lib/db";

let _configured = false;
function ensureConfigured() {
  if (_configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || "mailto:noreply@sidequest.app";
  if (!pub || !priv) {
    throw new Error("VAPID түлхүүр тохируулагдаагүй байна");
  }
  webpush.setVapidDetails(subj, pub, priv);
  _configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send a Web Push to every subscription belonging to a user.
 * Silently drops 404/410 (subscription expired) and removes the dead row.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  return sendPushToUsers([userId], payload);
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  ensureConfigured();

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  if (subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/notifications",
    type: payload.type,
    metadata: payload.metadata,
  });

  const deadIds: string[] = [];
  const usedIds: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body
        );
        usedIds.push(s.id);
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          deadIds.push(s.id);
        } else {
          console.error("[push] failed", s.endpoint, err);
        }
      }
    })
  );

  if (deadIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadIds } } }).catch(() => {});
  }
  if (usedIds.length > 0) {
    await prisma.pushSubscription
      .updateMany({ where: { id: { in: usedIds } }, data: { lastUsed: new Date() } })
      .catch(() => {});
  }
}
