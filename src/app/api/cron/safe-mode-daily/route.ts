import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SAFE_MODE_DAILY_XP } from "@/lib/safe-mode";

// Vercel Cron-аас өдөр бүр (UTC+8 08:00) дуудна
// Эсвэл админ ажиллуулна

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return processSafeMode();
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (firstUser?.id !== userId) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }
  return processSafeMode();
}

async function processSafeMode() {
  const now = new Date();
  const todayMidnight = new Date(now);
  todayMidnight.setUTCHours(0, 0, 0, 0);

  // ── 1. Expire-сэн SafeMode хэрэглэгчдийг унтрааx ──
  const expiredResult = await prisma.user.updateMany({
    where: {
      isSafeMode: true,
      safeModeExpires: { lte: now },
    },
    data: {
      isSafeMode: false,
    },
  });

  // ── 2. Идэвхтэй SafeMode хэрэглэгчдийг олох ──
  const activeUsers = await prisma.user.findMany({
    where: {
      isSafeMode: true,
      safeModeExpires: { gt: now },
    },
    select: {
      id: true,
      xp: true,
      streak: true,
      lastStreakDate: true,
      safeModeExpires: true,
    },
  });

  if (activeUsers.length === 0) {
    return NextResponse.json({
      success: true,
      expired: expiredResult.count,
      processed: 0,
      message: "Идэвхтэй SafeMode хэрэглэгч алга",
    });
  }

  // ── 3. Хэрэглэгч тус бүрд +10 XP, streak царцаах ──
  const ops = activeUsers.map((u) =>
    prisma.$transaction([
      prisma.user.update({
        where: { id: u.id },
        data: {
          xp: { increment: SAFE_MODE_DAILY_XP },
          // Streak-ийг өнөөдрийн огноогоор update хийж царцаана —
          // дараа өдөр streak логик "ѳчигдөр" гэж үзнэ
          lastStreakDate: todayMidnight,
        },
      }),
      prisma.notification.create({
        data: {
          userId: u.id,
          type: "SAFE_MODE_DAILY_XP",
          title: "🏕️ Camping XP",
          body: `Safe Mode-д +${SAFE_MODE_DAILY_XP} XP олголоо. Streak тань хадгалагдсан.`,
          metadata: { xpAwarded: SAFE_MODE_DAILY_XP },
        },
      }),
    ])
  );

  // Зэрэгцээ ажиллуулна
  await Promise.all(ops);

  return NextResponse.json({
    success: true,
    expired: expiredResult.count,
    processed: activeUsers.length,
    xpPerUser: SAFE_MODE_DAILY_XP,
    totalXpAwarded: activeUsers.length * SAFE_MODE_DAILY_XP,
    processedAt: now.toISOString(),
  });
}
