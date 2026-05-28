import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.shopItem.findMany({
    orderBy: [{ itemType: "asc" }, { price: "asc" }],
  });

  // Get user's purchased items
  const purchased = await prisma.userShopItem.findMany({
    where: { userId: user.id },
    include: { item: true },
  });

  return NextResponse.json({ items, purchased, userXp: user.xp });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopItemId } = await request.json();

  const item = await prisma.shopItem.findUnique({ where: { id: shopItemId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  if (user.xp < item.price) {
    return NextResponse.json({ error: "Not enough XP" }, { status: 400 });
  }

  // Deduct XP and create purchase
  await prisma.user.update({
    where: { id: user.id },
    data: { xp: { decrement: item.price } },
  });

  const purchase = await prisma.userShopItem.create({
    data: { userId: user.id, shopItemId: item.id },
    include: { item: true },
  });

  return NextResponse.json({ purchase }, { status: 201 });
}
