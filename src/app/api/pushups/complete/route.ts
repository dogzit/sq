import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { computePushupStatus, COINS_PER_REP } from "@/lib/pushup";

const MAX_REPS_PER_SESSION = 200;

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

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastPushupAt: true, coins: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  const status = computePushupStatus(current.lastPushupAt);
  if (!status.unlocked) {
    return NextResponse.json(
      { error: `Дараагийн суниалт ${status.daysLeft} хоногийн дараа` },
      { status: 403 },
    );
  }

  const coinsAwarded = reps * COINS_PER_REP;
  const now = new Date();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      coins: { increment: coinsAwarded },
      pushupTotalReps: { increment: reps },
      lastPushupAt: now,
    },
    select: { coins: true, pushupTotalReps: true },
  });

  return NextResponse.json({
    success: true,
    reps,
    coinsAwarded,
    newCoinBalance: updated.coins,
    totalReps: updated.pushupTotalReps,
    nextUnlockAt: computePushupStatus(now, now).nextUnlockAt,
  });
}
