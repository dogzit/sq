import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/games — list my matches (active + recent completed)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const matches = await prisma.gameMatch.findMany({
    where: {
      OR: [{ hostId: user.id }, { guestId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      guest: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ matches });
}
