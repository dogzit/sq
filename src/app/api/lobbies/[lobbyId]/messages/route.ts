import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pushTo, lobbyChannel } from "@/lib/pusher-server";

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
        select: { id: true, username: true, displayName: true, avatarUrl: true },
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
  if (!body) return NextResponse.json({ error: "Хоосон зурвас" }, { status: 400 });
  if (body.length > MAX_LEN) {
    return NextResponse.json({ error: `${MAX_LEN} тэмдэгтээс ихгүй` }, { status: 400 });
  }

  const created = await prisma.lobbyMessage.create({
    data: { lobbyId, userId: user.id, body },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  pushTo(lobbyChannel(lobbyId), "chat:new", created);

  return NextResponse.json({ message: created }, { status: 201 });
}
