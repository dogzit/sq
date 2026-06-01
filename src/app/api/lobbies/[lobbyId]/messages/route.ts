import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pushTo, lobbyChannel } from "@/lib/pusher-server";
import { createNotification } from "@/lib/notifications";

const MAX_LEN = 500;
const PAGE_SIZE = 50;

async function assertMember(userId: string, lobbyId: string) {
  return prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId, lobbyId } },
    select: { id: true },
  });
}

// GET /api/lobbies/:lobbyId/messages?before=<cursor>
export async function GET(
  req: Request,
  { params }: { params: Promise<{ lobbyId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { lobbyId } = await params;
  if (!(await assertMember(user.id, lobbyId))) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");

  const messages = await prisma.lobbyMessage.findMany({
    where: {
      lobbyId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
      },
      replyTo: {
        select: {
          id: true,
          body: true,
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
  });

  // Return chronological (oldest first) for easier rendering
  return NextResponse.json({ messages: messages.reverse() });
}

// POST /api/lobbies/:lobbyId/messages  body: { body: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ lobbyId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { lobbyId } = await params;
  if (!(await assertMember(user.id, lobbyId))) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const body = typeof json?.body === "string" ? json.body.trim() : "";
  const replyToId = typeof json?.replyToId === "string" ? json.replyToId : null;
  if (!body) return NextResponse.json({ error: "Хоосон зурвас" }, { status: 400 });
  if (body.length > MAX_LEN) {
    return NextResponse.json({ error: `${MAX_LEN} тэмдэгтээс ихгүй` }, { status: 400 });
  }

  // Validate reply target belongs to the same lobby
  let validReplyToId: string | null = null;
  if (replyToId) {
    const target = await prisma.lobbyMessage.findUnique({
      where: { id: replyToId },
      select: { lobbyId: true, userId: true },
    });
    if (target && target.lobbyId === lobbyId) validReplyToId = replyToId;
  }

  const created = await prisma.lobbyMessage.create({
    data: { lobbyId, userId: user.id, body, replyToId: validReplyToId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
      },
      replyTo: {
        select: {
          id: true,
          body: true,
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
  });

  pushTo(lobbyChannel(lobbyId), "chat:new", created);

  // Notify replied-to user (if not self)
  if (created.replyTo && created.replyTo.user.id !== user.id) {
    createNotification({
      userId: created.replyTo.user.id,
      type: "chat_reply",
      title: "💬 Хариулт ирлээ",
      body: `${user.displayName}: ${body.slice(0, 80)}`,
      metadata: { lobbyId, messageId: created.id },
    }).catch(() => {});
  }

  // Parse @mentions (@username) and notify lobby members whose usernames match
  const mentionMatches: string[] = [];
  for (const m of body.matchAll(/@([a-zA-Z0-9_]+)/g)) {
    if (m[1]) mentionMatches.push(m[1]);
  }
  if (mentionMatches.length > 0) {
    const unique = Array.from(new Set(mentionMatches));
    const members = await prisma.lobbyMember.findMany({
      where: {
        lobbyId,
        user: { username: { in: unique } },
      },
      select: { user: { select: { id: true, username: true } } },
    });
    const repliedToUserId = created.replyTo?.user.id ?? null;
    for (const m of members) {
      if (m.user.id === user.id) continue;
      if (m.user.id === repliedToUserId) continue; // already notified above
      createNotification({
        userId: m.user.id,
        type: "chat_mention",
        title: "📣 Та-г нэрлэлээ",
        body: `${user.displayName}: ${body.slice(0, 80)}`,
        metadata: { lobbyId, messageId: created.id },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ message: created }, { status: 201 });
}
