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
  const claimedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Atomic flip from unclaimed → claimed. If two requests race, only the
    // first one matches; the second returns count=0 and we throw.
    const flip = await tx.userAchievement.updateMany({
      where: { id: ua.id, claimed: false },
      data: { claimed: true, claimedAt },
    });
    if (flip.count === 0) throw new Error("ALREADY_CLAIMED");

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

    return { newXp, newLevel };
  }).catch((e) => {
    if (e instanceof Error && e.message === "ALREADY_CLAIMED") return null;
    throw e;
  });

  if (!result) {
    return NextResponse.json({ error: "Аль хэдийн авсан" }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    xpReward,
    coinReward,
    achievement: ua.achievement,
    claimedAt,
  });
}
