import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const BIRTHDAY_COINS = 100;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { birthDate: true },
  });
  if (!full?.birthDate) return NextResponse.json({ error: "Төрсөн өдөр бүртгэгдээгүй" }, { status: 400 });

  const bd = new Date(full.birthDate);
  const today = new Date();
  const isBirthday = bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
  if (!isBirthday) return NextResponse.json({ error: "Өнөөдөр таны төрсөн өдөр биш" }, { status: 400 });

  const yearKey = `birthday_${today.getFullYear()}`;

  // Serializable isolation prevents concurrent requests from both seeing
  // "no notification yet" and double-granting coins.
  const granted = await prisma.$transaction(async (tx) => {
    const existing = await tx.notification.findFirst({
      where: { userId: user.id, type: yearKey },
    });
    if (existing) return false;

    await tx.user.update({
      where: { id: user.id },
      data: { coins: { increment: BIRTHDAY_COINS } },
    });
    await tx.notification.create({
      data: {
        userId: user.id,
        type: yearKey,
        title: "🎂 Төрсөн өдрийн бэлэг",
        body: `Төрсөн өдрийн баяр хүргэе! +${BIRTHDAY_COINS} Coin бэлэглэлээ.`,
      },
    });
    return true;
  }, { isolationLevel: "Serializable" }).catch((e) => {
    // Postgres returns 40001 (serialization failure) when concurrent txs conflict.
    // That means the other one won — treat as already-granted.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2034") {
      return false;
    }
    throw e;
  });

  if (!granted) return NextResponse.json({ alreadyGranted: true });
  return NextResponse.json({ granted: true, coins: BIRTHDAY_COINS });
}
