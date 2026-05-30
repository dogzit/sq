import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const answered = await prisma.userTriviaAnswer.findMany({
    where: { userId: user.id },
    select: { questionId: true },
  });
  const answeredIds = answered.map((a) => a.questionId);

  const questions = await prisma.triviaQuestion.findMany({
    where: {
      id: { notIn: answeredIds },
      creatorId: { not: user.id },
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      question: true,
      options: true,
      coinReward: true,
      xpReward: true,
      creator: { select: { displayName: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await req.json();
  const { question, options, correctIndex, coinReward, xpReward } = body;

  if (typeof question !== "string" || question.trim().length < 5) {
    return NextResponse.json({ error: "Асуулт хэт богино байна" }, { status: 400 });
  }
  if (!Array.isArray(options) || options.length !== 4 || options.some((o) => !o?.trim())) {
    return NextResponse.json({ error: "4 сонголт бүрэн оруулна уу" }, { status: 400 });
  }
  if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex > 3) {
    return NextResponse.json({ error: "Зөв хариулт сонгоно уу" }, { status: 400 });
  }
  const coin = Math.min(Math.max(Number(coinReward) || 10, 1), 100);
  const xp = Math.min(Math.max(Number(xpReward) || 20, 1), 200);

  const created = await prisma.triviaQuestion.create({
    data: {
      question: question.trim(),
      options: options.map((o: string) => o.trim()),
      correctIndex,
      coinReward: coin,
      xpReward: xp,
      creatorId: user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
