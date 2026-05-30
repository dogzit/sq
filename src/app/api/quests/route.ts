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
      expiresAt: { gt: new Date() },
      ...(lobbyId ? { lobbyId } : {}),
    },
    include: {
      submissions: {
        where: { userId: user.id },
        select: { id: true, vetoStatus: true, photoUrl: true },
      },
      template: {
        include: { category: true },
      },
      _count: { select: { submissions: true } },
    },
    orderBy: { expiresAt: "asc" },
  });

  return NextResponse.json({ quests });
}
