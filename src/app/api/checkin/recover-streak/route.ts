import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_DAYS_MISSED = 3; // beyond this, no recovery
const MAX_PRICE = 500;

function getMongoliaDate(d = new Date()): Date {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const mn = new Date(utc + 8 * 3600000);
  return new Date(mn.toISOString().split("T")[0] + "T00:00:00Z");
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / (24 * 3600 * 1000));
}

export function recoveryPrice(streak: number): number {
  return Math.min(streak * 20, MAX_PRICE);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { streak: true, lastStreakDate: true, coins: true },
  });
  if (!fresh) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });

  if (!fresh.lastStreakDate || fresh.streak === 0) {
    return NextResponse.json({ eligible: false, reason: "no-streak" });
  }

  const today = getMongoliaDate();
  const last = getMongoliaDate(fresh.lastStreakDate);
  const daysMissed = daysBetween(today, last);

  if (daysMissed <= 1) {
    return NextResponse.json({ eligible: false, reason: "not-lost", daysMissed });
  }
  if (daysMissed > MAX_DAYS_MISSED + 1) {
    return NextResponse.json({ eligible: false, reason: "too-late", daysMissed });
  }

  const price = recoveryPrice(fresh.streak);
  return NextResponse.json({
    eligible: true,
    streak: fresh.streak,
    daysMissed,
    price,
    canAfford: fresh.coins >= price,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { streak: true, lastStreakDate: true },
  });
  if (!fresh?.lastStreakDate || fresh.streak === 0) {
    return NextResponse.json({ error: "Сэргээх streak алга" }, { status: 400 });
  }

  const today = getMongoliaDate();
  const last = getMongoliaDate(fresh.lastStreakDate);
  const daysMissed = daysBetween(today, last);

  if (daysMissed <= 1) {
    return NextResponse.json({ error: "Streak алдаагүй байна" }, { status: 400 });
  }
  if (daysMissed > MAX_DAYS_MISSED + 1) {
    return NextResponse.json({ error: "Сэргээх хугацаа хэтэрсэн" }, { status: 400 });
  }

  const price = recoveryPrice(fresh.streak);

  // Set lastStreakDate to yesterday so the next check-in extends the streak.
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  // Atomic conditional charge — prevents double-spend AND prevents recovering
  // the same streak twice (re-check lastStreakDate hasn't changed).
  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      coins: { gte: price },
      lastStreakDate: fresh.lastStreakDate,
    },
    data: {
      coins: { decrement: price },
      lastStreakDate: yesterday,
    },
  });

  if (result.count === 0) {
    const refetch = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true },
    });
    if ((refetch?.coins ?? 0) < price) {
      return NextResponse.json({ error: "Coin хүрэлцэхгүй" }, { status: 400 });
    }
    return NextResponse.json({ error: "Аль хэдийн сэргээгдсэн" }, { status: 409 });
  }

  return NextResponse.json({ success: true, streak: fresh.streak, price });
}
