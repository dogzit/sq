import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { selectedIndex } = body;

  if (typeof selectedIndex !== "number") {
    return NextResponse.json({ error: "Сонголт буруу байна" }, { status: 400 });
  }

  const existing = await prisma.userTriviaAnswer.findUnique({
    where: { userId_questionId: { userId: user.id, questionId: id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Та энэ асуултанд хариулсан байна" }, { status: 409 });
  }

  const question = await prisma.triviaQuestion.findUnique({
    where: { id },
    select: { correctIndex: true, coinReward: true, xpReward: true, creatorId: true, status: true },
  });
  if (!question) return NextResponse.json({ error: "Асуулт олдсонгүй" }, { status: 404 });
  if (question.status !== "APPROVED") {
    return NextResponse.json({ error: "Асуулт батлагдаагүй байна" }, { status: 403 });
  }
  if (question.creatorId === user.id) {
    return NextResponse.json({ error: "Өөрийнхөө асуултанд хариулж болохгүй" }, { status: 403 });
  }

  const isCorrect = selectedIndex === question.correctIndex;
  const coinsEarned = isCorrect ? question.coinReward : 0;
  const xpEarned = isCorrect ? question.xpReward : 0;

  await prisma.$transaction([
    prisma.userTriviaAnswer.create({
      data: {
        userId: user.id,
        questionId: id,
        selectedIndex,
        isCorrect,
        coinsEarned,
        xpEarned,
      },
    }),
    ...(isCorrect
      ? [
          prisma.user.update({
            where: { id: user.id },
            data: { coins: { increment: coinsEarned }, xp: { increment: xpEarned } },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    isCorrect,
    correctIndex: question.correctIndex,
    coinsEarned,
    xpEarned,
  });
}
