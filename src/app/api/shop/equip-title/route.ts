import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purchaseId, lobbyId } = await request.json();

  if (!purchaseId || !lobbyId) {
    return NextResponse.json({ error: "Purchase ID and lobby ID required" }, { status: 400 });
  }

  const purchase = await prisma.userShopItem.findUnique({
    where: { id: purchaseId },
    include: { item: true },
  });

  if (!purchase || purchase.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (purchase.item.itemType !== "TITLE") {
    return NextResponse.json({ error: "Not a title item" }, { status: 400 });
  }

  // Update lobby member's custom title
  await prisma.lobbyMember.update({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
    data: { customTitle: purchase.item.value },
  });

  return NextResponse.json({ title: purchase.item.value });
}
