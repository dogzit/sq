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
  const alreadyGranted = await prisma.notification.findFirst({
    where: { userId: user.id, type: yearKey },
  });
  if (alreadyGranted) return NextResponse.json({ alreadyGranted: true });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: BIRTHDAY_COINS } },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        type: yearKey,
        title: "🎂 Төрсөн өдрийн бэлэг",
        body: `Төрсөн өдрийн баяр хүргэе! +${BIRTHDAY_COINS} Coin бэлэглэлээ.`,
      },
    }),
  ]);

  return NextResponse.json({ granted: true, coins: BIRTHDAY_COINS });
}
