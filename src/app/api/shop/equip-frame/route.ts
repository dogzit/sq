import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const purchaseId: string | null = body?.purchaseId ?? null;

  // Unequip: clear the field.
  if (!purchaseId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { equippedFrameValue: null },
    });
    return NextResponse.json({ equippedFrameValue: null });
  }

  const purchase = await prisma.userShopItem.findUnique({
    where: { id: purchaseId },
    include: { item: true },
  });

  if (!purchase || purchase.userId !== user.id) {
    return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  }
  if (purchase.item.itemType !== "AVATAR_FRAME") {
    return NextResponse.json({ error: "Frame төрлийн бараа биш байна" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { equippedFrameValue: purchase.item.value },
  });

  return NextResponse.json({ equippedFrameValue: purchase.item.value });
}
