import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { escrowBet } from "@/lib/games";
import { createNotification } from "@/lib/notifications";

// PATCH /api/games/challenges/:matchId  body: { action: "ACCEPT" | "DECLINE" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { matchId } = await params;
  const { action } = await req.json().catch(() => ({}));
  if (action !== "ACCEPT" && action !== "DECLINE") {
    return NextResponse.json({ error: "Буруу үйлдэл" }, { status: 400 });
  }

  const match = await prisma.gameMatch.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (match.guestId !== user.id) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }
  if (match.status !== "PENDING") {
    return NextResponse.json({ error: "Аль хэдийн шийдвэрлэгдсэн" }, { status: 400 });
  }

  if (action === "DECLINE") {
    await prisma.gameMatch.update({
      where: { id: matchId },
      data: { status: "CANCELLED", endedAt: new Date() },
    });
    createNotification({
      userId: match.hostId,
      type: "game_declined",
      title: "Challenge татгалзагдлаа",
      body: `${user.displayName} challenge-г татгалзлаа`,
      metadata: { matchId },
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "CANCELLED" });
  }

  // ACCEPT — escrow both players' coins and activate
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await escrowBet(tx, match.hostId, match.guestId, match.betAmount);
      return tx.gameMatch.update({
        where: { id: matchId },
        data: { status: "ACTIVE", startedAt: new Date() },
      });
    });
    createNotification({
      userId: match.hostId,
      type: "game_accepted",
      title: "🎮 Challenge зөвшөөрөгдлөө!",
      body: `${user.displayName} тоглоход бэлэн. Орцгооё!`,
      metadata: { matchId },
    }).catch(() => {});
    return NextResponse.json({ ok: true, match: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "ESCROW_FAILED";
    if (msg === "HOST_INSUFFICIENT" || msg === "GUEST_INSUFFICIENT") {
      await prisma.gameMatch.update({
        where: { id: matchId },
        data: { status: "CANCELLED", endedAt: new Date() },
      });
      return NextResponse.json(
        { error: "Талуудын аль нэгэнд coin хүрэлцэхгүй боллоо" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Эхлүүлэх боломжгүй" }, { status: 500 });
  }
}

// DELETE — host cancels their own pending challenge
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { matchId } = await params;
  const match = await prisma.gameMatch.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (match.hostId !== user.id) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }
  if (match.status !== "PENDING") {
    return NextResponse.json({ error: "Цуцлах боломжгүй" }, { status: 400 });
  }

  await prisma.gameMatch.update({
    where: { id: matchId },
    data: { status: "CANCELLED", endedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
