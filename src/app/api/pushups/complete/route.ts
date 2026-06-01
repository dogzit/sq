import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { computePushupStatus, COINS_PER_REP, PUSHUP_COOLDOWN_DAYS } from "@/lib/pushup";

const MAX_REPS_PER_SESSION = 200;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const reps = Math.floor(Number(body.reps));
  if (!Number.isFinite(reps) || reps <= 0) {
    return NextResponse.json(
      { error: "Reps буруу байна" },
      { status: 400 },
    );
  }
  if (reps > MAX_REPS_PER_SESSION) {
    return NextResponse.json(
      { error: `Нэг удаагийн дээд хязгаар ${MAX_REPS_PER_SESSION}` },
      { status: 400 },
    );
  }

  const coinsAwarded = reps * COINS_PER_REP;
  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - PUSHUP_COOLDOWN_DAYS * MS_PER_DAY);

  // Atomic conditional update: only succeeds if cooldown elapsed.
  // Prevents double-award from concurrent requests.
  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      OR: [{ lastPushupAt: null }, { lastPushupAt: { lt: cooldownThreshold } }],
    },
    data: {
      coins: { increment: coinsAwarded },
      pushupTotalReps: { increment: reps },
      lastPushupAt: now,
    },
  });

  if (result.count === 0) {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastPushupAt: true },
    });
    const status = computePushupStatus(current?.lastPushupAt ?? null, now);
    return NextResponse.json(
      { error: `Дараагийн суниалт ${status.daysLeft} хоногийн дараа` },
      { status: 403 },
    );
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { coins: true, pushupTotalReps: true },
  });

  return NextResponse.json({
    success: true,
    reps,
    coinsAwarded,
    newCoinBalance: updated?.coins ?? 0,
    totalReps: updated?.pushupTotalReps ?? 0,
    nextUnlockAt: computePushupStatus(now, now).nextUnlockAt,
  });
}
