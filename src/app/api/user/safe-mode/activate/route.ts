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

  // Atomic conditional decrement — prevents two concurrent requests both
  // reading coins ≥ cost and double-charging (which could even push coins below 0).
  const updated = await prisma.$transaction(async (tx) => {
    const charge = await tx.user.updateMany({
      where: { id: user.id, coins: { gte: cost } },
      data: {
        coins: { decrement: cost },
        isSafeMode: true,
        safeModeExpires: newExpiry,
      },
    });
    if (charge.count === 0) throw new Error("INSUFFICIENT");

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "SAFE_MODE_ACTIVATED",
        title: "🏕️ Camping Pass идэвхжлээ",
        body: `Та ${days} хоног Safe Mode-д орлоо. Streak тань царцана, өдөр бүр +10 XP олно.`,
        metadata: { days, cost, expiresAt: newExpiry.toISOString() },
      },
    });

    return tx.user.findUnique({
      where: { id: user.id },
      select: { coins: true, isSafeMode: true, safeModeExpires: true },
    });
  }).catch((e) => {
    if (e instanceof Error && e.message === "INSUFFICIENT") return null;
    throw e;
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Coin хүрэлцэхгүй байна" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    days,
    cost,
    coins: updated.coins,
    isSafeMode: updated.isSafeMode,
    safeModeExpires: updated.safeModeExpires,
  });
}
