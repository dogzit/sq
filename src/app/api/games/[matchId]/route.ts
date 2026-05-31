import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GameState, initState, viewForPlayer } from "@/lib/games-engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { matchId } = await params;
  const match = await prisma.gameMatch.findUnique({
    where: { id: matchId },
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      guest: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      winner: { select: { id: true, username: true, displayName: true } },
    },
  });
  if (!match) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (match.hostId !== user.id && match.guestId !== user.id) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }

  const rawState: GameState =
    (match.state as GameState | null) ?? initState(match.gameType, match.hostId);
  const state = match.status === "COMPLETED" ? rawState : viewForPlayer(rawState, user.id);

  return NextResponse.json({ match: { ...match, state } });
}
