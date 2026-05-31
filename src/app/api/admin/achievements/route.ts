import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { unlocks: true } } },
  });
  return NextResponse.json({ achievements });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const body = await req.json();
  const { key, name, description, iconEmoji, xpReward, coinReward, rarity } = body;
  if (!key || !name || !description) {
    return NextResponse.json({ error: "key, name, description шаардлагатай" }, { status: 400 });
  }

  const achievement = await prisma.achievement.create({
    data: {
      key,
      name,
      description,
      iconEmoji: iconEmoji || "🏆",
      xpReward: Number(xpReward) || 0,
      coinReward: Number(coinReward) || 0,
      rarity: rarity || "COMMON",
    },
  });
  return NextResponse.json({ achievement });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const body = await req.json();
  const { id, name, description, iconEmoji, xpReward, coinReward, rarity } = body;
  if (!id) return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 });

  const updated = await prisma.achievement.update({
    where: { id },
    data: {
      name,
      description,
      iconEmoji,
      xpReward: Number(xpReward) || 0,
      coinReward: Number(coinReward) || 0,
      rarity,
    },
  });
  return NextResponse.json({ updated });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 });
  await prisma.achievement.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
