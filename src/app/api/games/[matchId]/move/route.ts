import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  applyMove,
  GameState,
  initState,
  viewForPlayer,
} from "@/lib/games-engine";
import { pushToUser } from "@/lib/realtime";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { matchId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });

  const match = await prisma.gameMatch.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (match.hostId !== user.id && match.guestId !== user.id) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }
  if (match.status !== "ACTIVE") {
    return NextResponse.json({ error: "Идэвхгүй match" }, { status: 400 });
  }

  const current: GameState =
    (match.state as GameState | null) ?? initState(match.gameType, match.hostId);

  const next = applyMove(current, user.id, body.move, match.hostId, match.guestId);
  if (!next) return NextResponse.json({ error: "Хүчингүй move" }, { status: 400 });

  // Persist + settle in one transaction.
  if (next.done) {
    const winnerId = next.winnerId;
    const isDraw = next.draw;
    const settled = await prisma.$transaction(async (tx) => {
      // Atomic finalize — only first request to mark COMPLETED wins.
      // Prevents double payout if two final moves race (e.g. timeout + move).
      const flip = await tx.gameMatch.updateMany({
        where: { id: matchId, status: "ACTIVE" },
        data: {
          status: "COMPLETED",
          winnerId: isDraw ? null : winnerId,
          isDraw,
          endedAt: new Date(),
          state: next as never,
        },
      });
      if (flip.count === 0) return false;

      if (isDraw) {
        await tx.user.update({
          where: { id: match.hostId },
          data: { coins: { increment: match.betAmount } },
        });
        await tx.user.update({
          where: { id: match.guestId },
          data: { coins: { increment: match.betAmount } },
        });
      } else if (winnerId) {
        await tx.user.update({
          where: { id: winnerId },
          data: { coins: { increment: match.betAmount * 2 } },
        });
      }
      return true;
    });

    if (!settled) {
      return NextResponse.json({ ok: true, done: true, alreadyFinalized: true });
    }

    // Notify both players coin balance changed
    pushToUser(match.hostId, "coins:changed", {});
    pushToUser(match.guestId, "coins:changed", {});

    const endPayload = {
      matchId,
      state: next,
      winnerId: isDraw ? null : winnerId,
      draw: isDraw,
      payout: match.betAmount * 2,
    };
    pushToUser(match.hostId, "match:end", endPayload);
    pushToUser(match.guestId, "match:end", endPayload);
    return NextResponse.json({ ok: true, done: true });
  }

  await prisma.gameMatch.update({
    where: { id: matchId },
    data: { state: next as never },
  });

  // Push per-player view (so RPS opponent's move stays hidden until both move)
  pushToUser(match.hostId, "match:state", { ...viewForPlayer(next, match.hostId), matchId });
  pushToUser(match.guestId, "match:state", { ...viewForPlayer(next, match.guestId), matchId });

  return NextResponse.json({ ok: true });
}
