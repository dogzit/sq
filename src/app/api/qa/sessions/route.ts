import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sessionCreateSchema } from "@/lib/validations";
import type { GameType } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = sessionCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { lobbyId, gameType = "TRIVIA", roundCount = 5 } = parsed.data;

  // Verify membership
  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member) return NextResponse.json({ error: "Гишүүн биш байна" }, { status: 403 });

  // Pick random questions from TriviaBank
  const allQuestions = await prisma.triviaBank.findMany();
  if (allQuestions.length === 0) {
    return NextResponse.json({ error: "Trivia асуулт олдсонгүй" }, { status: 500 });
  }

  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  const session = await prisma.qASession.create({
    data: {
      gameType: gameType as GameType,
      roundCount: selected.length,
      lobbyId,
      questions: {
        create: selected.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          round: i + 1,
        })),
      },
    },
    include: {
      questions: { orderBy: { round: "asc" } },
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get("lobbyId");
  const sessionId = searchParams.get("sessionId");

  // Fetch single session by ID
  if (sessionId) {
    const session = await prisma.qASession.findUnique({
      where: { id: sessionId },
      include: {
        questions: { orderBy: { round: "asc" } },
      },
    });
    if (!session) return NextResponse.json({ error: "Тоглоом олдсонгүй" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (!lobbyId) return NextResponse.json({ error: "Lobby шаардлагатай" }, { status: 400 });

  const sessions = await prisma.qASession.findMany({
    where: { lobbyId },
    include: {
      questions: {
        include: { _count: { select: { answers: true } } },
        orderBy: { round: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ sessions });
}
