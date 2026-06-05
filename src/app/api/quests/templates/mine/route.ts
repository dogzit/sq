import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const templates = await prisma.questTemplate.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      xpReward: true,
      coinReward: true,
      status: true,
      rejectReason: true,
      reviewedAt: true,
      createdAt: true,
      approvedQuestId: true,
    },
  });

  return NextResponse.json({ templates });
}
