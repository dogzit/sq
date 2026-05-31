import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateDailyQuestBatch, type AiQuest } from "@/lib/ai-quest";

const QUESTS_PER_REQUEST = 3;

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { lobbyId } = await request.json();
  if (!lobbyId) {
    return NextResponse.json({ error: "lobbyId шаардлагатай" }, { status: 400 });
  }

  // Зөвхөн lobby-ийн гишүүн л generate хийж чадна
  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Та энэ lobby-д гишүүн биш байна" }, { status: 403 });
  }

  const quests = await generateDailyQuestBatch(QUESTS_PER_REQUEST);
  if (quests.length === 0) {
    return NextResponse.json(
      { error: "AI quest үүсгэж чадсангүй" },
      { status: 502 },
    );
  }

  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const created = await prisma.$transaction(
    quests.map((q: AiQuest) =>
      prisma.quest.create({
        data: {
          title: q.title,
          description: q.description,
          xpReward: q.rewardXP,
          coinReward: q.rewardCoins,
          difficulty: q.difficulty,
          questType: "DAILY",
          status: "ACTIVE",
          expiresAt: endOfDay,
          lobbyId,
          isAiGenerated: true,
          bonusClass: q.bonusClass === "NONE" ? null : q.bonusClass,
        },
      }),
    ),
  );

  return NextResponse.json({ quests: created }, { status: 201 });
}
