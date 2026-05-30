import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get("lobbyId");

  if (lobbyId) {
    // Lobby leaderboard
    const members = await prisma.lobbyMember.findMany({
      where: { lobbyId },
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true,
            avatarUrl: true, xp: true, coins: true, level: true, streak: true,
          },
        },
      },
      orderBy: { xpInLobby: "desc" },
    });

    return NextResponse.json({
      leaderboard: members.map((m, i) => ({
        rank: i + 1,
        ...m.user,
        xpInLobby: m.xpInLobby,
      })),
    });
  }

  // Global leaderboard
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, displayName: true,
      avatarUrl: true, xp: true, coins: true, level: true, streak: true,
    },
    orderBy: { xp: "desc" },
    take: 50,
  });

  return NextResponse.json({
    leaderboard: users.map((u, i) => ({ rank: i + 1, ...u })),
  });
}
