import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDailyQuestBatch } from "@/lib/ai-quest";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

// Vercel Cron — өдөр бүр өглөө 07:00 UTC+8 (Mongolia)
// cron expression: "0 23 * * *"  → UTC 23:00 = UTC+8 07:00

const DAILY_QUEST_COUNT = 5;

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

    // Expire stale active AI-generated quests
    await prisma.quest.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: startedAt },
        isAiGenerated: true,
      },
      data: { status: "EXPIRED" },
    });

    // Generate via Claude
    const quests = await generateDailyQuestBatch(DAILY_QUEST_COUNT);

    if (quests.length === 0) {
      return NextResponse.json(
        { error: "AI quest generation failed — no quests produced" },
        { status: 502 }
      );
    }

    // Insert into DB. Global (lobbyId: null), expires at end of day.
    const endOfDay = new Date(startedAt);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const created = await prisma.$transaction(
      quests.map((q) =>
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
            lobbyId: null,
            isAiGenerated: true,
          },
          select: {
            id: true,
            title: true,
            xpReward: true,
            coinReward: true,
            difficulty: true,
          },
        })
      )
    );

    const elapsedMs = Date.now() - startedAt.getTime();

    return NextResponse.json({
      success: true,
      requested: DAILY_QUEST_COUNT,
      generated: quests.length,
      inserted: created.length,
      elapsedMs,
      quests: created,
    });
  } catch (err) {
    console.error("AI daily quests cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
