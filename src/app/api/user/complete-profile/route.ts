import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkAchievements } from "@/lib/achievements";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await req.json();
  const { birthDate, phone, interests, bio } = body;

  if (!birthDate || !Array.isArray(interests)) {
    return NextResponse.json({ error: "Шаардлагатай талбарууд дутуу байна" }, { status: 400 });
  }

  const wasComplete = (
    await prisma.user.findUnique({
      where: { id: user.id },
      select: { isProfileComplete: true },
    })
  )?.isProfileComplete;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      birthDate: new Date(birthDate),
      phone: phone ?? null,
      interests,
      bio: bio ?? null,
      isProfileComplete: true,
    },
    select: {
      id: true,
      isProfileComplete: true,
      birthDate: true,
      phone: true,
      interests: true,
      bio: true,
    },
  });

  // Anх удаа profile бүрэн бөглөсөн тохиолдолд achievement шалгана
  const unlocked = !wasComplete
    ? await checkAchievements(user.id, { profileCompleted: true })
    : [];

  return NextResponse.json({ ...updated, unlockedAchievements: unlocked });
}
