import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { answerSchema } from "@/lib/validations";
import { checkAchievements } from "@/lib/achievements";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { questionId, selectedIndex, responseTimeMs } = parsed.data;

  const question = await prisma.qAQuestion.findUnique({
    where: { id: questionId },
    include: { session: true },
  });

  if (!question) return NextResponse.json({ error: "Асуулт олдсонгүй" }, { status: 404 });

  const existing = await prisma.qAAnswer.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });
  if (existing) return NextResponse.json({ error: "Аль хэдийн хариулсан байна" }, { status: 409 });

  const isCorrect = selectedIndex === question.correctIndex;

  // Coins only (no XP) — prevents grind through repeated trivia
  // 5 coins per correct answer, speed bonus: +3 if under 3s, +2 if under 5s, +1 if under 10s
  let coinsEarned = 0;
  if (isCorrect) {
    coinsEarned = 5;
    if (responseTimeMs < 3000) coinsEarned += 3;
    else if (responseTimeMs < 5000) coinsEarned += 2;
    else if (responseTimeMs < 10000) coinsEarned += 1;
  }

  const answer = await prisma.qAAnswer.create({
    data: {
      selectedIndex,
      isCorrect,
      responseTimeMs,
      xpEarned: 0,
      userId: user.id,
      questionId,
    },
  });

  if (coinsEarned > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: coinsEarned } },
    });
  }

  // Check if all questions in session are answered — check for trivia perfect
  const allAnswers = await prisma.qAAnswer.findMany({
    where: { userId: user.id, question: { sessionId: question.sessionId } },
  });
  const totalQuestions = await prisma.qAQuestion.count({ where: { sessionId: question.sessionId } });
  if (allAnswers.length === totalQuestions) {
    const correctCount = allAnswers.filter((a) => a.isCorrect).length;
    checkAchievements(user.id, {
      triviaScore: { correct: correctCount, total: totalQuestions },
    }).catch(() => {});
  }

  return NextResponse.json({
    answer,
    correct: isCorrect,
    correctIndex: question.correctIndex,
    coinsEarned,
  });
}
