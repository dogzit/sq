import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get("lobbyId");

  const quests = await prisma.quest.findMany({
    where: {
      status: "ACTIVE",
      ...(lobbyId
        ? { lobbyId }
        : {
            lobby: { members: { some: { userId: user.id } } },
          }),
    },
    include: {
      lobby: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true } },
        },
      },
      submissions: {
        where: { userId: user.id },
        select: {
          id: true,
          vetoStatus: true,
          mediaUrl: true,
          mediaType: true,
          approveCount: true,
          rejectCount: true,
        },
      },
      _count: {
        select: {
          submissions: {
            where: {
              userId: { not: user.id },
              vetoStatus: "PENDING",
              votes: { none: { voterId: user.id } },
            },
          },
        },
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  return NextResponse.json({ quests });
}
