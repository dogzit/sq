import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Vercel Cron calls this every day at 08:00 UTC+8 (Mongolia time)
// Also callable by admin via POST /api/cron/daily-quests with admin auth

export async function GET(request: Request) {
  // Verify cron secret for automated calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return generateDailyQuests();
}

export async function POST(request: Request) {
  // Admin-triggered generation — auth checked via proxy + admin check
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  if (firstUser?.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return generateDailyQuests();
}

async function generateDailyQuests() {
  // Get all templates
  const templates = await prisma.questTemplate.findMany({
    include: { category: true },
  });

  if (templates.length === 0) {
    return NextResponse.json({ error: "No templates found" }, { status: 404 });
  }

  // Expire old active quests
  await prisma.quest.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all active lobbies
  const lobbies = await prisma.lobby.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const created: any[] = [];

  // Generate 3 global quests
  const globalPicks = pickRandom(templates, 3);
  for (const tpl of globalPicks) {
    const quest = await prisma.quest.create({
      data: {
        title: tpl.title,
        description: tpl.description,
        xpReward: tpl.xpReward,
        difficulty: tpl.difficulty,
        expiresAt: endOfDay,
        lobbyId: null,
        templateId: tpl.id,
      },
    });
    created.push(quest);
  }

  // Generate 3 quests per lobby
  for (const lobby of lobbies) {
    const lobbyPicks = pickRandom(templates, 3);
    for (const tpl of lobbyPicks) {
      const quest = await prisma.quest.create({
        data: {
          title: tpl.title,
          description: tpl.description,
          xpReward: tpl.xpReward,
          difficulty: tpl.difficulty,
          expiresAt: endOfDay,
          lobbyId: lobby.id,
          templateId: tpl.id,
        },
      });
      created.push(quest);
    }
  }

  return NextResponse.json({
    success: true,
    generated: created.length,
    lobbies: lobbies.length,
    global: globalPicks.length,
  });
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
