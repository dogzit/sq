import { prisma } from "@/lib/db";
import { pushToUser } from "@/lib/realtime";

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
}
