import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";

const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "LEGENDARY"] as const;
type Difficulty = (typeof VALID_DIFFICULTIES)[number];

/** Reward caps per difficulty — keep user-authored quests in line with the economy. */
const REWARD_CAPS: Record<Difficulty, { xp: number; coins: number }> = {
  EASY:      { xp: 40,  coins: 15 },
  MEDIUM:    { xp: 80,  coins: 30 },
  HARD:      { xp: 150, coins: 55 },
  LEGENDARY: { xp: 250, coins: 100 },
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const difficulty: Difficulty = VALID_DIFFICULTIES.includes(body.difficulty)
    ? body.difficulty
    : "MEDIUM";

  if (title.length < 4) return NextResponse.json({ error: "Гарчиг хэт богино" }, { status: 400 });
  if (title.length > 80) return NextResponse.json({ error: "Гарчиг 80 тэмдэгтээс ихгүй" }, { status: 400 });
  if (description.length < 10) return NextResponse.json({ error: "Тайлбар хэт богино" }, { status: 400 });
  if (description.length > 500) return NextResponse.json({ error: "Тайлбар 500 тэмдэгтээс ихгүй" }, { status: 400 });

  const cap = REWARD_CAPS[difficulty];
  const xpReward = Math.min(Math.max(Number(body.xpReward) || 50, 5), cap.xp);
  const coinReward = Math.min(Math.max(Number(body.coinReward) || 15, 0), cap.coins);

  const created = await prisma.questTemplate.create({
    data: {
      title,
      description,
      difficulty,
      xpReward,
      coinReward,
      creatorId: user.id,
    },
    select: { id: true },
  });

  notifyAdmins({
    excludeUserId: user.id,
    type: "QUEST_TEMPLATE_PENDING",
    title: "🎯 Шинэ quest батлах хүлээгдэж байна",
    body: `${user.displayName}: "${title.slice(0, 60)}${title.length > 60 ? "…" : ""}"`,
    metadata: { questTemplateId: created.id, creatorUsername: user.username },
  }).catch(() => {});

  return NextResponse.json({ id: created.id }, { status: 201 });
}
