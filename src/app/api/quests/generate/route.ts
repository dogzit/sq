import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { lobbyId, categoryId } = await request.json();

  const where = categoryId ? { categoryId } : {};

  const templates = await prisma.questTemplate.findMany({
    where,
    include: { category: true },
  });

  if (templates.length === 0) {
    return NextResponse.json({ error: "Template олдсонгүй" }, { status: 404 });
  }

  // Pick random templates (3 quests per day)
  const shuffled = templates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(3, shuffled.length));

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const quests = await Promise.all(
    selected.map((tpl) =>
      prisma.quest.create({
        data: {
          title: tpl.title,
          description: tpl.description,
          xpReward: tpl.xpReward,
          difficulty: tpl.difficulty,
          expiresAt: endOfDay,
          lobbyId: lobbyId || null,
          templateId: tpl.id,
        },
        include: {
          template: { include: { category: true } },
        },
      })
    )
  );

  return NextResponse.json({ quests }, { status: 201 });
}
