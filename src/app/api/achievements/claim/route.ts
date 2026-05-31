import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateLevel } from "@/lib/economy";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { achievementId } = await req.json().catch(() => ({}));
  if (!achievementId) {
    return NextResponse.json({ error: "achievementId шаардлагатай" }, { status: 400 });
  }

  const ua = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId: user.id, achievementId } },
    include: { achievement: true },
  });

  if (!ua) {
    return NextResponse.json({ error: "Achievement түгжээтэй байна" }, { status: 404 });
  }
  if (ua.claimed) {
    return NextResponse.json({ error: "Аль хэдийн авсан" }, { status: 400 });
  }

  const { xpReward, coinReward } = ua.achievement;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.userAchievement.update({
      where: { id: ua.id },
      data: { claimed: true, claimedAt: new Date() },
    });

    let newXp: number | null = null;
    let newLevel: number | null = null;
    if (xpReward > 0 || coinReward > 0) {
      const before = await tx.user.findUnique({
        where: { id: user.id },
        select: { xp: true, level: true },
      });
      newXp = (before?.xp ?? 0) + xpReward;
      newLevel = calculateLevel(newXp);
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(xpReward > 0 && { xp: newXp, level: newLevel }),
          ...(coinReward > 0 && { coins: { increment: coinReward } }),
        },
      });
    }

    return { updated, newXp, newLevel };
  });

  return NextResponse.json({
    success: true,
    xpReward,
    coinReward,
    achievement: ua.achievement,
    claimedAt: result.updated.claimedAt,
  });
}
