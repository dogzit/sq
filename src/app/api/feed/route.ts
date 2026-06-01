import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const LIMIT = 30;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  // Friends (accepted both ways)
  const fs = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const friendIds = fs.map((f) =>
    f.requesterId === user.id ? f.addresseeId : f.requesterId
  );

  if (friendIds.length === 0) {
    return NextResponse.json({ events: [] });
  }

  // 1) Approved quest submissions
  const subs = await prisma.questSubmission.findMany({
    where: { userId: { in: friendIds }, vetoStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      createdAt: true,
      mediaUrl: true,
      mediaType: true,
      xpAwarded: true,
      caption: true,
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
      },
      quest: { select: { id: true, title: true } },
    },
  });

  // 2) Unlocked achievements (claimed)
  const achs = await prisma.userAchievement.findMany({
    where: { userId: { in: friendIds }, claimed: true },
    orderBy: { unlockedAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      unlockedAt: true,
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
      },
      achievement: { select: { name: true, iconEmoji: true, rarity: true } },
    },
  });

  type FeedEvent =
    | {
        kind: "submission";
        id: string;
        at: string;
        user: typeof subs[number]["user"];
        quest: { id: string; title: string } | null;
        mediaUrl: string;
        mediaType: string;
        xpAwarded: number;
        caption: string | null;
      }
    | {
        kind: "achievement";
        id: string;
        at: string;
        user: typeof achs[number]["user"];
        achievement: { name: string; iconEmoji: string; rarity: string };
      };

  const events: FeedEvent[] = [
    ...subs.map((s) => ({
      kind: "submission" as const,
      id: `sub_${s.id}`,
      at: s.createdAt.toISOString(),
      user: s.user,
      quest: s.quest,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      xpAwarded: s.xpAwarded,
      caption: s.caption,
    })),
    ...achs.map((a) => ({
      kind: "achievement" as const,
      id: `ach_${a.id}`,
      at: a.unlockedAt.toISOString(),
      user: a.user,
      achievement: a.achievement,
    })),
  ];

  events.sort((a, b) => (a.at < b.at ? 1 : -1));

  return NextResponse.json({ events: events.slice(0, LIMIT) });
}
