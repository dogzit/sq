import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  updateStreak,
  dailyCheckInReward,
  dailyCheckInXpReward,
  calculateLevel,
} from "@/lib/economy";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  // Get full user with streak + xp data
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { streak: true, lastStreakDate: true, xp: true },
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

  // Calculate rewards (coin + xp)
  const reward = dailyCheckInReward(newStreak);
  const xpReward = dailyCheckInXpReward(newStreak);
  const newXp = fullUser.xp + xpReward;
  const newLevel = calculateLevel(newXp);

  // Save check-in and update user in transaction
  await prisma.$transaction([
    prisma.dailyCheckIn.create({
      data: { userId: user.id, date: today, reward, xpReward },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        coins: { increment: reward },
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastStreakDate,
      },
    }),
  ]);

  return NextResponse.json({
    reward,
    xpReward,
    newXp,
    newLevel,
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
  const previewStreak = todayCheckIn
    ? currentStreak
    : updateStreak(currentStreak, fullUser?.lastStreakDate || null).newStreak;
  const pendingReward = todayCheckIn ? 0 : dailyCheckInReward(previewStreak);
  const pendingXpReward = todayCheckIn ? 0 : dailyCheckInXpReward(previewStreak);

  return NextResponse.json({
    checkedInToday: !!todayCheckIn,
    todayReward: todayCheckIn?.reward || 0,
    todayXpReward: todayCheckIn?.xpReward || 0,
    pendingReward,
    pendingXpReward,
    streak: currentStreak,
    nextMilestone: [7, 14, 21, 28].find((m) => m > currentStreak) || null,
  });
}
