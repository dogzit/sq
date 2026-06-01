import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkAchievements } from "@/lib/achievements";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const items = await prisma.shopItem.findMany({
    orderBy: [{ itemType: "asc" }, { price: "asc" }],
  });

  // Get user's purchased items
  const purchased = await prisma.userShopItem.findMany({
    where: { userId: user.id },
    include: { item: true },
  });

  return NextResponse.json({ items, purchased, userCoins: user.coins });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { shopItemId } = await request.json();

  const item = await prisma.shopItem.findUnique({ where: { id: shopItemId } });
  if (!item) return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 404 });

  // Atomic purchase: check balance, prevent duplicate cosmetic, deduct, create in one transaction
  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!freshUser || freshUser.coins < item.price) {
        throw new Error("INSUFFICIENT_COINS");
      }
      // Cosmetics (TITLE, AVATAR_FRAME) are owned forever — block duplicate purchases.
      if (item.itemType === "TITLE" || item.itemType === "AVATAR_FRAME") {
        const existing = await tx.userShopItem.findFirst({
          where: { userId: user.id, shopItemId: item.id },
        });
        if (existing) throw new Error("ALREADY_OWNED");
      }
      await tx.user.update({
        where: { id: user.id },
        data: { coins: { decrement: item.price } },
      });
      return tx.userShopItem.create({
        data: { userId: user.id, shopItemId: item.id },
        include: { item: true },
      });
    });
    checkAchievements(user.id, { coinsSpent: item.price }).catch(() => {});
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (e: any) {
    if (e.message === "INSUFFICIENT_COINS") {
      return NextResponse.json({ error: "Coin хүрэхгүй байна" }, { status: 400 });
    }
    if (e.message === "ALREADY_OWNED") {
      return NextResponse.json({ error: "Аль хэдийн авсан байна" }, { status: 409 });
    }
    throw e;
  }
}
