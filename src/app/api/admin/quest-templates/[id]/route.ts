import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { calculateLevel } from "@/lib/economy";

/** How long the spawned Quest stays ACTIVE once admin approves a template. */
const APPROVED_QUEST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { action, rejectReason } = body ?? {};

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "action нь APPROVE/REJECT байх" }, { status: 400 });
  }

  const existing = await prisma.questTemplate.findUnique({
    where: { id },
    select: {
      creatorId: true,
      title: true,
      description: true,
      xpReward: true,
      coinReward: true,
      difficulty: true,
      status: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Аль хэдийн шийдэгдсэн байна" }, { status: 409 });
  }

  const isApprove = action === "APPROVE";

  let createdQuestId: string | null = null;
  let creatorReward: { xp: number; coins: number } | null = null;

  if (isApprove) {
    // 1) Spawn the public Quest from this template (global — lobbyId=null).
    const quest = await prisma.quest.create({
      data: {
        title: existing.title,
        description: existing.description,
        xpReward: existing.xpReward,
        coinReward: existing.coinReward,
        difficulty: existing.difficulty,
        questType: "DAILY",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + APPROVED_QUEST_DURATION_MS),
        isAiGenerated: false,
      },
      select: { id: true },
    });
    createdQuestId = quest.id;

    // 2) Credit the creator (same rule as trivia: their own quest's rewards).
    const creator = await prisma.user.findUnique({
      where: { id: existing.creatorId },
      select: { xp: true },
    });
    if (creator) {
      const newXp = creator.xp + existing.xpReward;
      await prisma.user.update({
        where: { id: existing.creatorId },
        data: {
          xp: newXp,
          coins: { increment: existing.coinReward },
          level: calculateLevel(newXp),
        },
      });
      creatorReward = { xp: existing.xpReward, coins: existing.coinReward };
    }
  }

  const notifBody = isApprove
    ? `"${existing.title.slice(0, 60)}…" quest нийтэд харагдах боллоо.${
        creatorReward ? ` +${creatorReward.xp} XP, +${creatorReward.coins} 🪙` : ""
      }`
    : `"${existing.title.slice(0, 60)}…" quest татгалзагдсан${rejectReason ? `: ${rejectReason}` : "."}`;

  await prisma.$transaction([
    prisma.questTemplate.update({
      where: { id },
      data: {
        status: isApprove ? "APPROVED" : "REJECTED",
        rejectReason: isApprove ? null : (typeof rejectReason === "string" ? rejectReason : null),
        reviewedAt: new Date(),
        reviewedById: user.id,
        approvedQuestId: createdQuestId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: existing.creatorId,
        type: isApprove ? "QUEST_TEMPLATE_APPROVED" : "QUEST_TEMPLATE_REJECTED",
        title: isApprove ? "✅ Quest батлагдлаа" : "❌ Quest татгалзагдлаа",
        body: notifBody,
        metadata: createdQuestId ? { questId: createdQuestId } : undefined,
      },
    }),
  ]);

  return NextResponse.json({ success: true, action, createdQuestId, creatorReward });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.questTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
