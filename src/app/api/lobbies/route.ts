import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateLobbyCode } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lobbies = await prisma.lobby.findMany({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, xp: true } },
        },
      },
      _count: { select: { quests: true, qaSessions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ lobbies });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  let code = generateLobbyCode();
  while (await prisma.lobby.findUnique({ where: { code } })) {
    code = generateLobbyCode();
  }

  const lobby = await prisma.lobby.create({
    data: {
      name,
      code,
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, username: true, displayName: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({ lobby }, { status: 201 });
}
