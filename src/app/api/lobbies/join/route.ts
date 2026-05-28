import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Invite code required" }, { status: 400 });

  const lobby = await prisma.lobby.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { members: true } } },
  });

  if (!lobby || !lobby.isActive) {
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
  }

  if (lobby._count.members >= lobby.maxMembers) {
    return NextResponse.json({ error: "Lobby is full" }, { status: 400 });
  }

  const existing = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId: lobby.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  await prisma.lobbyMember.create({
    data: { userId: user.id, lobbyId: lobby.id },
  });

  const updated = await prisma.lobby.findUnique({
    where: { id: lobby.id },
    include: {
      owner: { select: { id: true, username: true, displayName: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, xp: true } },
        },
      },
    },
  });

  return NextResponse.json({ lobby: updated });
}
