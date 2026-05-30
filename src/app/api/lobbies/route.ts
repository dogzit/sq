import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateLobbyCode } from "@/lib/utils";
import { lobbyCreateSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

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
      _count: { select: { quests: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ lobbies });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = lobbyCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { name } = parsed.data;

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
