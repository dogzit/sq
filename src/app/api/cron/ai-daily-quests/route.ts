import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDailyQuestBatch, type AiQuest } from "@/lib/ai-quest";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

// Vercel Cron — өдөр бүр өглөө 07:00 UTC+8 (Mongolia)
// cron expression: "0 23 * * *"  → UTC 23:00 = UTC+8 07:00

const QUESTS_PER_LOBBY = 5;

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return generateAndInsert();
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }
  return generateAndInsert();
}

async function generateAndInsert() {
  try {
    const startedAt = new Date();

    await prisma.quest.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: startedAt },
        isAiGenerated: true,
      },
      data: { status: "EXPIRED" },
    });

    const lobbies = await prisma.lobby.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (lobbies.length === 0) {
      return NextResponse.json({
        success: true,
        lobbies: 0,
        generated: 0,
        inserted: 0,
        message: "Идэвхтэй lobby алга",
      });
    }

    const endOfDay = new Date(startedAt);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const results = await Promise.all(
      lobbies.map(async (lobby) => {
        const quests = await generateDailyQuestBatch(QUESTS_PER_LOBBY);
        if (quests.length === 0) return { lobbyId: lobby.id, inserted: 0 };

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
                lobbyId: lobby.id,
                isAiGenerated: true,
                bonusClass: q.bonusClass === "NONE" ? null : q.bonusClass,
              },
              select: { id: true },
            }),
          ),
        );
        return { lobbyId: lobby.id, inserted: created.length };
      }),
    );

    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const elapsedMs = Date.now() - startedAt.getTime();

    return NextResponse.json({
      success: true,
      lobbies: lobbies.length,
      requestedPerLobby: QUESTS_PER_LOBBY,
      inserted: totalInserted,
      elapsedMs,
      perLobby: results,
    });
  } catch (err) {
    console.error("AI daily quests cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
