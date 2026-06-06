import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const PAGE_SIZE = 10;
// Pull a wider window from each source so interleaving doesn't drop events.
const FETCH_BUFFER = 25;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const cursorDate = cursor ? new Date(cursor) : null;
  if (cursor && (!cursorDate || Number.isNaN(cursorDate.getTime()))) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

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
    return NextResponse.json({ events: [], nextCursor: null });
  }

  const [subs, achs] = await Promise.all([
    prisma.questSubmission.findMany({
      where: {
        userId: { in: friendIds },
        vetoStatus: "APPROVED",
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: FETCH_BUFFER,
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
    }),
    prisma.userAchievement.findMany({
      where: {
        userId: { in: friendIds },
        claimed: true,
        ...(cursorDate ? { unlockedAt: { lt: cursorDate } } : {}),
      },
      orderBy: { unlockedAt: "desc" },
      take: FETCH_BUFFER,
      select: {
        id: true,
        unlockedAt: true,
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
        },
        achievement: { select: { name: true, iconEmoji: true, rarity: true } },
      },
    }),
  ]);

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

  const merged: FeedEvent[] = [
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

  merged.sort((a, b) => (a.at < b.at ? 1 : -1));
  const page = merged.slice(0, PAGE_SIZE);

  // Has-more if we filled the page AND there is at least one more item in the
  // merged buffer beyond the page. nextCursor is the oldest "at" we returned.
  const nextCursor =
    page.length === PAGE_SIZE && merged.length > PAGE_SIZE
      ? page[page.length - 1].at
      : null;

  return NextResponse.json({ events: page, nextCursor });
}
