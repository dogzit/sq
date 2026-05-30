import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { lobbyJoinSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = lobbyJoinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { code } = parsed.data;

  const lobby = await prisma.lobby.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { members: true } } },
  });

  if (!lobby || !lobby.isActive) {
    return NextResponse.json({ error: "Lobby олдсонгүй" }, { status: 404 });
  }

  if (lobby._count.members >= lobby.maxMembers) {
    return NextResponse.json({ error: "Lobby дүүрсэн байна" }, { status: 400 });
  }

  const existing = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId: lobby.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Аль хэдийн гишүүн байна" }, { status: 409 });
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
