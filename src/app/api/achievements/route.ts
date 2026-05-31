import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkAchievements } from "@/lib/achievements";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  // Backfill: re-evaluate achievements that may have been missed by older flows.
  // checkAchievements is idempotent (skips already-unlocked keys).
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isProfileComplete: true },
  });
  if (me?.isProfileComplete) {
    await checkAchievements(user.id, { profileCompleted: true }).catch(() => {});
  }

  const [achievements, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: [{ claimed: "asc" }, { unlockedAt: "desc" }],
    }),
  ]);

  return NextResponse.json({ achievements, unlocked });
}
