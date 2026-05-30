import { prisma } from "@/lib/db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata || undefined,
    },
  });
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

  const notifications = members
    .filter((m) => m.userId !== params.excludeUserId)
    .map((m) => ({
      userId: m.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata || undefined,
    }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}
