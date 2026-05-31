import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { areFriends, MIN_BET, MAX_BET, GAME_LABELS, GameTypeStr } from "@/lib/games";
import { createNotification } from "@/lib/notifications";

// POST /api/games/challenges — create a new challenge against a friend
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });

  const opponentId = typeof body.opponentId === "string" ? body.opponentId : null;
  const gameType = body.gameType as GameTypeStr | undefined;
  const betAmount = Number(body.betAmount);

  if (!opponentId || opponentId === user.id) {
    return NextResponse.json({ error: "Өрсөлдөгч сонгоно уу" }, { status: 400 });
  }
  if (!gameType || !["RPS", "TTT", "COIN_FLIP"].includes(gameType)) {
    return NextResponse.json({ error: "Тоглоом сонгоно уу" }, { status: 400 });
  }
  if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
    return NextResponse.json(
      { error: `Bet ${MIN_BET}-${MAX_BET} coin байх ёстой` },
      { status: 400 }
    );
  }

  if (!(await areFriends(user.id, opponentId))) {
    return NextResponse.json({ error: "Зөвхөн найзтайгаа тоглоно" }, { status: 403 });
  }

  const [me, opp] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { coins: true } }),
    prisma.user.findUnique({
      where: { id: opponentId },
      select: { id: true, coins: true, displayName: true, username: true },
    }),
  ]);
  if (!opp) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  if ((me?.coins ?? 0) < betAmount) {
    return NextResponse.json({ error: "Coin хүрэлцэхгүй байна" }, { status: 400 });
  }
  if (opp.coins < betAmount) {
    return NextResponse.json({ error: "Өрсөлдөгчид coin хүрэлцэхгүй" }, { status: 400 });
  }

  // Disallow stacking many pending challenges with same opponent
  const existing = await prisma.gameMatch.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { hostId: user.id, guestId: opponentId },
        { hostId: opponentId, guestId: user.id },
      ],
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Шийдвэрлэгдээгүй challenge байна" },
      { status: 409 }
    );
  }

  const match = await prisma.gameMatch.create({
    data: {
      gameType,
      hostId: user.id,
      guestId: opponentId,
      betAmount,
      status: "PENDING",
    },
  });

  createNotification({
    userId: opponentId,
    type: "game_challenge",
    title: "🎮 Тоглоомын challenge",
    body: `${user.displayName} танд ${GAME_LABELS[gameType]} (${betAmount} 🪙) санал болголоо`,
    metadata: { matchId: match.id, gameType, betAmount, fromUserId: user.id },
  }).catch(() => {});

  return NextResponse.json({ match }, { status: 201 });
}

// GET /api/games/challenges — list my pending incoming + outgoing challenges
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const challenges = await prisma.gameMatch.findMany({
    where: {
      status: "PENDING",
      OR: [{ hostId: user.id }, { guestId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      guest: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ challenges });
}
