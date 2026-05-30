import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateStreak, dailyCheckInReward } from "@/lib/economy";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  // Get full user with streak data
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { streak: true, lastStreakDate: true },
  });
  if (!fullUser) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  // Calculate today's date (Mongolia UTC+8)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const mongoliaDate = new Date(utc + 8 * 3600000);
  const todayStr = mongoliaDate.toISOString().split("T")[0];
  const today = new Date(todayStr + "T00:00:00Z");

  // Check if already checked in today
  const existing = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });
  if (existing) {
    return NextResponse.json({
      error: "Өнөөдөр аль хэдийн check-in хийсэн байна",
      reward: existing.reward,
      alreadyClaimed: true,
    }, { status: 409 });
  }

  // Update streak
  const { newStreak, lastStreakDate } = updateStreak(fullUser.streak, fullUser.lastStreakDate);

  // Calculate reward
  const reward = dailyCheckInReward(newStreak);

  // Save check-in and update user in transaction
  await prisma.$transaction([
    prisma.dailyCheckIn.create({
      data: { userId: user.id, date: today, reward },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        coins: { increment: reward },
        streak: newStreak,
        lastStreakDate,
      },
    }),
  ]);

  return NextResponse.json({
    reward,
    streak: newStreak,
    nextMilestone: [7, 14, 21, 28].find((m) => m > newStreak) || null,
  }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  // Check today's status
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const mongoliaDate = new Date(utc + 8 * 3600000);
  const todayStr = mongoliaDate.toISOString().split("T")[0];
  const today = new Date(todayStr + "T00:00:00Z");

  const todayCheckIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  // Get full user streak data
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { streak: true, lastStreakDate: true },
  });

  const currentStreak = fullUser?.streak || 0;
  const pendingReward = todayCheckIn ? 0 : dailyCheckInReward(
    // Preview what streak would be after check-in
    updateStreak(currentStreak, fullUser?.lastStreakDate || null).newStreak
  );

  return NextResponse.json({
    checkedInToday: !!todayCheckIn,
    todayReward: todayCheckIn?.reward || 0,
    pendingReward,
    streak: currentStreak,
    nextMilestone: [7, 14, 21, 28].find((m) => m > currentStreak) || null,
  });
}
