import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  }

  const unclaimedAchievements = await prisma.userAchievement.count({
    where: { userId: user.id, claimed: false },
  });

  return NextResponse.json({
    user: { ...user, unclaimedAchievements },
  });
}
