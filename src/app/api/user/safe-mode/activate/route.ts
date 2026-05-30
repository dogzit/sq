import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateCampingPassCost,
  isValidDays,
  SAFE_MODE_MAX_DAYS,
  SAFE_MODE_MIN_DAYS,
} from "@/lib/safe-mode";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await req.json();
  const { days } = body;

  if (!isValidDays(days)) {
    return NextResponse.json(
      { error: `Хоног ${SAFE_MODE_MIN_DAYS}-${SAFE_MODE_MAX_DAYS} хооронд байх ёстой` },
      { status: 400 }
    );
  }

  const cost = calculateCampingPassCost(days);

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { coins: true, isSafeMode: true, safeModeExpires: true },
  });
  if (!fresh) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  if (fresh.coins < cost) {
    return NextResponse.json(
      { error: `Coin хүрэлцэхгүй байна. Шаардлагатай: ${cost}, танд: ${fresh.coins}` },
      { status: 400 }
    );
  }

  // Extend from current expiry if still active, else from now
  const now = new Date();
  const baseDate =
    fresh.isSafeMode && fresh.safeModeExpires && fresh.safeModeExpires > now
      ? fresh.safeModeExpires
      : now;
  const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: { id: user.id },
      data: {
        coins: { decrement: cost },
        isSafeMode: true,
        safeModeExpires: newExpiry,
      },
      select: {
        coins: true,
        isSafeMode: true,
        safeModeExpires: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "SAFE_MODE_ACTIVATED",
        title: "🏕️ Camping Pass идэвхжлээ",
        body: `Та ${days} хоног Safe Mode-д орлоо. Streak тань царцана, өдөр бүр +10 XP олно.`,
        metadata: { days, cost, expiresAt: newExpiry.toISOString() },
      },
    });

    return result;
  });

  return NextResponse.json({
    success: true,
    days,
    cost,
    coins: updated.coins,
    isSafeMode: updated.isSafeMode,
    safeModeExpires: updated.safeModeExpires,
  });
}
