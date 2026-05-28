import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateLevel } from "@/lib/utils";
import { answerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { questionId, selectedIndex, responseTimeMs } = parsed.data;

  const question = await prisma.qAQuestion.findUnique({
    where: { id: questionId },
    include: { session: true },
  });

  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const existing = await prisma.qAAnswer.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });
  if (existing) return NextResponse.json({ error: "Already answered" }, { status: 409 });

  const isCorrect = selectedIndex === question.correctIndex;

  // XP: correct = base 20, + speed bonus (max 30 if under 3s)
  let xpEarned = 0;
  if (isCorrect) {
    xpEarned = 20;
    if (responseTimeMs < 3000) xpEarned += 30;
    else if (responseTimeMs < 5000) xpEarned += 20;
    else if (responseTimeMs < 10000) xpEarned += 10;
  }

  const answer = await prisma.qAAnswer.create({
    data: {
      selectedIndex,
      isCorrect,
      responseTimeMs,
      xpEarned,
      userId: user.id,
      questionId,
    },
  });

  if (xpEarned > 0) {
    const newXp = user.xp + xpEarned;
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: newXp, level: calculateLevel(newXp) },
    });

    // Update lobby XP
    if (question.session.lobbyId) {
      await prisma.lobbyMember.updateMany({
        where: { userId: user.id, lobbyId: question.session.lobbyId },
        data: { xpInLobby: { increment: xpEarned } },
      });
    }
  }

  return NextResponse.json({
    answer,
    correct: isCorrect,
    correctIndex: question.correctIndex,
    xpEarned,
  });
}
