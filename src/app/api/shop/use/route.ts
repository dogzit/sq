import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purchaseId, targetUserId } = await request.json();

  if (!purchaseId || !targetUserId) {
    return NextResponse.json({ error: "Purchase ID and target user required" }, { status: 400 });
  }

  const purchase = await prisma.userShopItem.findUnique({
    where: { id: purchaseId },
    include: { item: true },
  });

  if (!purchase || purchase.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (purchase.used) {
    return NextResponse.json({ error: "Already used" }, { status: 400 });
  }
  if (purchase.item.itemType === "TITLE") {
    return NextResponse.json({ error: "Titles cannot be used on others" }, { status: 400 });
  }

  // BUFF: can only target someone else, DEBUFF: can only target someone else
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot use on yourself" }, { status: 400 });
  }

  const effectType = purchase.item.itemType === "BUFF" ? "BUFF" : "DEBUFF";
  const multiplier = parseFloat(purchase.item.value);

  // Create effect lasting 24 hours
  const effect = await prisma.activeEffect.create({
    data: {
      effectType,
      multiplier,
      casterId: user.id,
      targetId: targetUserId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Mark purchase as used
  await prisma.userShopItem.update({
    where: { id: purchaseId },
    data: { used: true },
  });

  return NextResponse.json({ effect }, { status: 201 });
}
