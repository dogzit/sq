import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const questions = await prisma.triviaQuestion.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      question: true,
      options: true,
      correctIndex: true,
      coinReward: true,
      xpReward: true,
      status: true,
      rejectReason: true,
      reviewedAt: true,
      createdAt: true,
      _count: { select: { answers: true } },
    },
  });

  return NextResponse.json({ questions });
}
