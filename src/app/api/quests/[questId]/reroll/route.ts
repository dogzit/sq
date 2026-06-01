import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateAiQuest } from "@/lib/ai-quest";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ questId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { questId } = await params;

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return NextResponse.json({ error: "Quest олдсонгүй" }, { status: 404 });
  if (quest.status !== "ACTIVE") {
    return NextResponse.json({ error: "Зөвхөн идэвхтэй quest reroll хийнэ" }, { status: 400 });
  }
  if (!quest.lobbyId) {
    return NextResponse.json({ error: "Зөвхөн lobby quest reroll хийнэ" }, { status: 400 });
  }

  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId: quest.lobbyId } },
    select: { id: true },
  });
  if (!member) return NextResponse.json({ error: "Та энэ lobby-д гишүүн биш" }, { status: 403 });

  // User must not have already submitted to this quest (otherwise their submission
  // would orphan).
  const mySubmission = await prisma.questSubmission.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
    select: { id: true },
  });
  if (mySubmission) {
    return NextResponse.json(
      { error: "Submission илгээсэн quest-ийг reroll хийх боломжгүй" },
      { status: 400 }
    );
  }

  // Atomically consume a QUEST_REROLL purchase belonging to the user.
  const reroll = await prisma.userShopItem.findFirst({
    where: { userId: user.id, used: false, item: { itemType: "QUEST_REROLL" } },
    orderBy: { createdAt: "asc" },
  });
  if (!reroll) {
    return NextResponse.json({ error: "Quest reroll-ын тоо хүрэлцэхгүй" }, { status: 400 });
  }

  const consumed = await prisma.userShopItem.updateMany({
    where: { id: reroll.id, used: false },
    data: { used: true },
  });
  if (consumed.count === 0) {
    return NextResponse.json({ error: "Reroll аль хэдийн ашиглагдсан" }, { status: 409 });
  }

  // Generate a new quest via AI
  let aiQuest;
  try {
    aiQuest = await generateAiQuest();
  } catch {
    // Refund the reroll on AI failure
    await prisma.userShopItem.update({
      where: { id: reroll.id },
      data: { used: false },
    });
    return NextResponse.json({ error: "AI quest үүсгэж чадсангүй" }, { status: 502 });
  }

  const newQuest = await prisma.$transaction(async (tx) => {
    // Cancel the old quest (only if no one has submitted to it yet).
    const subCount = await tx.questSubmission.count({ where: { questId } });
    if (subCount === 0) {
      await tx.quest.update({
        where: { id: questId },
        data: { status: "EXPIRED" },
      });
    }
    return tx.quest.create({
      data: {
        title: aiQuest.title,
        description: aiQuest.description,
        xpReward: aiQuest.rewardXP,
        coinReward: aiQuest.rewardCoins,
        difficulty: aiQuest.difficulty,
        questType: quest.questType,
        status: "ACTIVE",
        expiresAt: quest.expiresAt,
        lobbyId: quest.lobbyId,
        isAiGenerated: true,
        bonusClass: aiQuest.bonusClass === "NONE" ? null : aiQuest.bonusClass,
      },
    });
  });

  return NextResponse.json({ quest: newQuest }, { status: 201 });
}
