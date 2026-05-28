import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { GameType } from "@/generated/prisma/client";

const triviaBank = [
  { question: "Дэлхийн хамгийн өндөр уул юу вэ?", options: ["K2", "Everest", "Kangchenjunga", "Lhotse"], correctIndex: 1 },
  { question: "Нарны аймгийн хамгийн том гараг юу вэ?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], correctIndex: 1 },
  { question: "Монгол улсын нийслэл юу вэ?", options: ["Дархан", "Эрдэнэт", "Улаанбаатар", "Чойбалсан"], correctIndex: 2 },
  { question: "HTML гэдэг юуны товчлол вэ?", options: ["HyperText Markup Language", "High Tech ML", "Home Tool ML", "HyperTransfer ML"], correctIndex: 0 },
  { question: "Усны химийн томъёо юу вэ?", options: ["CO2", "H2O", "O2", "NaCl"], correctIndex: 1 },
  { question: "JavaScript-ийг хэн зохиосон бэ?", options: ["Guido van Rossum", "James Gosling", "Brendan Eich", "Dennis Ritchie"], correctIndex: 2 },
  { question: "1 км = хэдэн метр?", options: ["100", "500", "1000", "10000"], correctIndex: 2 },
  { question: "Дэлхийн хамгийн том далай юу вэ?", options: ["Атлантик", "Номхон", "Энэтхэг", "Хойд мөсөн"], correctIndex: 1 },
  { question: "Хүний биед хэдэн яс байдаг вэ?", options: ["106", "206", "306", "156"], correctIndex: 1 },
  { question: "React-ийг аль компани хөгжүүлсэн бэ?", options: ["Google", "Apple", "Facebook", "Microsoft"], correctIndex: 2 },
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lobbyId, gameType = "TRIVIA", roundCount = 5 } = await request.json();

  if (!lobbyId) return NextResponse.json({ error: "Lobby ID required" }, { status: 400 });

  // Verify membership
  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Pick random questions
  const shuffled = [...triviaBank].sort(() => Math.random() - 0.5);
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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get("lobbyId");

  if (!lobbyId) return NextResponse.json({ error: "Lobby ID required" }, { status: 400 });

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
