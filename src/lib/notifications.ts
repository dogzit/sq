import { prisma } from "@/lib/db";
import { pushToUser } from "@/lib/realtime";
import { sendPushToUsers } from "@/lib/push";
import { sendNotificationEmail } from "@/lib/email";

interface NotifPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

function emitNew(userIds: string[], notif: NotifPayload) {
  for (const uid of userIds) {
    pushToUser(uid, "notification:new", notif);
  }
}

function urlForNotification(type: string, metadata?: Record<string, unknown>): string {
  if (!metadata) return "/notifications";
  if (type === "vote_needed" && metadata.questId) return `/quests/${metadata.questId}`;
  if (type === "submission_approved" && metadata.questId) return `/quests/${metadata.questId}`;
  if (type === "submission_rejected" && metadata.questId) return `/quests/${metadata.questId}`;
  if (type === "friend_request" && metadata.username) return `/users/${metadata.username}`;
  if (type === "friend_accepted" && metadata.username) return `/users/${metadata.username}`;
  if (type === "match_invite" && metadata.matchId) return `/games/${metadata.matchId}`;
  if (type === "lobby_message" && metadata.lobbyId) return `/lobbies/${metadata.lobbyId}`;
  return "/notifications";
}

/**
 * Fan-out the just-created notification(s) to: realtime WS, web push, email.
 * Failures in any channel are swallowed — DB notification is the source of truth.
 */
async function fanout(notifs: { userId: string; type: string; title: string; body: string; metadata: unknown }[]) {
  if (notifs.length === 0) return;

  const userIds = Array.from(new Set(notifs.map((n) => n.userId)));

  // Web push (in parallel for all subs)
  await Promise.all(
    notifs.map((n) =>
      sendPushToUsers([n.userId], {
        title: n.title,
        body: n.body,
        type: n.type,
        url: urlForNotification(n.type, (n.metadata ?? undefined) as Record<string, unknown> | undefined),
        metadata: (n.metadata ?? undefined) as Record<string, unknown> | undefined,
      }).catch(() => {})
    )
  );

  // Email duplicates — only if user has verified email
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, emailVerified: true, email: { not: "" } },
    select: { id: true, email: true },
  });
  const emailByUserId = Object.fromEntries(users.map((u) => [u.id, u.email]));

  await Promise.all(
    notifs.map((n) => {
      const to = emailByUserId[n.userId];
      if (!to) return Promise.resolve();
      return sendNotificationEmail({
        to,
        title: n.title,
        body: n.body,
        url: urlForNotification(n.type, (n.metadata ?? undefined) as Record<string, unknown> | undefined),
      }).catch((err) => console.error("[email] notif failed", err));
    })
  );
}

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}) {
  const created = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata || undefined,
    },
  });
  emitNew([params.userId], {
    id: created.id,
    type: created.type,
    title: created.title,
    body: created.body,
    metadata: (created.metadata ?? null) as Record<string, unknown> | null,
    createdAt: created.createdAt,
  });
  // Fire-and-forget — don't block the caller on push/email
  fanout([
    {
      userId: created.userId,
      type: created.type,
      title: created.title,
      body: created.body,
      metadata: created.metadata,
    },
  ]).catch(() => {});
  return created;
}

/** Notify all lobby members except the excluded user */
export async function notifyLobbyMembers(params: {
  lobbyId: string;
  excludeUserId?: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}) {
  const members = await prisma.lobbyMember.findMany({
    where: { lobbyId: params.lobbyId },
    select: { userId: true },
  });

  const recipients = members
    .map((m) => m.userId)
    .filter((id) => id !== params.excludeUserId);

  if (recipients.length === 0) return;

  // createMany is fast but doesn't return rows. Fall back to per-user create so we get IDs for the push.
  const created = await prisma.$transaction(
    recipients.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: params.type,
          title: params.title,
          body: params.body,
          metadata: params.metadata || undefined,
        },
      })
    )
  );

  for (const n of created) {
    pushToUser(n.userId, "notification:new", {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      metadata: (n.metadata ?? null) as Record<string, unknown> | null,
      createdAt: n.createdAt,
    });
  }
  fanout(
    created.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      metadata: n.metadata,
    }))
  ).catch(() => {});
}

/** Notify all admin users */
export async function notifyAdmins(params: {
  excludeUserId?: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}) {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });

  const recipients = admins
    .map((a) => a.id)
    .filter((id) => id !== params.excludeUserId);

  if (recipients.length === 0) return;

  const created = await prisma.$transaction(
    recipients.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: params.type,
          title: params.title,
          body: params.body,
          metadata: params.metadata || undefined,
        },
      })
    )
  );

  for (const n of created) {
    pushToUser(n.userId, "notification:new", {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      metadata: (n.metadata ?? null) as Record<string, unknown> | null,
      createdAt: n.createdAt,
    });
  }
  fanout(
    created.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      metadata: n.metadata,
    }))
  ).catch(() => {});
}
