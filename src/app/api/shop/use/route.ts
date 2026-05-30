import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { purchaseId, targetUserId } = await request.json();

  if (!purchaseId || !targetUserId) {
    return NextResponse.json({ error: "Худалдан авалт болон хэрэглэгч шаардлагатай" }, { status: 400 });
  }

  const purchase = await prisma.userShopItem.findUnique({
    where: { id: purchaseId },
    include: { item: true },
  });

  if (!purchase || purchase.userId !== user.id) {
    return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });
  }
  if (purchase.used) {
    return NextResponse.json({ error: "Аль хэдийн ашигласан байна" }, { status: 400 });
  }
  if (purchase.item.itemType === "TITLE" || purchase.item.itemType === "AVATAR_FRAME") {
    return NextResponse.json({ error: "Энэ төрлийн бараа хэрэглэгч дээр ашиглах боломжгүй" }, { status: 400 });
  }
  if (purchase.item.itemType === "QUEST_REROLL") {
    return NextResponse.json({ error: "Quest reroll ашиглана уу" }, { status: 400 });
  }

  // XP_BOOST: self-only. BUFF/DEBUFF: others only.
  if (purchase.item.itemType === "XP_BOOST") {
    if (targetUserId !== user.id) {
      return NextResponse.json({ error: "XP Boost can only be used on yourself" }, { status: 400 });
    }
  } else if (targetUserId === user.id) {
    return NextResponse.json({ error: "Өөртөө ашиглах боломжгүй" }, { status: 400 });
  }

  const effectType = (purchase.item.itemType === "DEBUFF") ? "DEBUFF" : "BUFF";
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

  // Notify target if it's not self
  if (targetUserId !== user.id) {
    createNotification({
      userId: targetUserId,
      type: effectType === "BUFF" ? "buff_received" : "debuff_received",
      title: effectType === "BUFF" ? "Buff авлаа!" : "Debuff ирлээ!",
      body: `${user.displayName} танд ${purchase.item.name} ашиглалаа`,
      metadata: { effectId: effect.id, casterName: user.displayName },
    }).catch(() => {});
  }

  return NextResponse.json({ effect }, { status: 201 });
}
