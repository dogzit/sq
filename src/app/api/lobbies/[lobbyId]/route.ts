import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lobbyId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { lobbyId } = await params;

  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member) return NextResponse.json({ error: "Гишүүн биш байна" }, { status: 403 });

  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, xp: true, level: true } },
        },
        orderBy: { xpInLobby: "desc" },
      },
      quests: {
        where: { status: "ACTIVE" },
        orderBy: { expiresAt: "asc" },
        take: 10,
      },
      qaSessions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!lobby) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });

  return NextResponse.json({ lobby });
}
