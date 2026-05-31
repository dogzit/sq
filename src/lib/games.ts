import { prisma } from "@/lib/db";

export type GameTypeStr = "RPS" | "TTT" | "COIN_FLIP";

export const GAME_LABELS: Record<GameTypeStr, string> = {
  RPS: "Чулуу-Цаас-Хайч",
  TTT: "Tic-Tac-Toe",
  COIN_FLIP: "Зоос шидэх",
};

export const MIN_BET = 5;
export const MAX_BET = 5000;

/** Reserve both players' bet by deducting from balances. Throws if insufficient. */
export async function escrowBet(
  tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  hostId: string,
  guestId: string,
  bet: number
) {
  const [host, guest] = await Promise.all([
    tx.user.findUnique({ where: { id: hostId }, select: { coins: true } }),
    tx.user.findUnique({ where: { id: guestId }, select: { coins: true } }),
  ]);
  if (!host || !guest) throw new Error("USER_NOT_FOUND");
  if (host.coins < bet) throw new Error("HOST_INSUFFICIENT");
  if (guest.coins < bet) throw new Error("GUEST_INSUFFICIENT");

  await Promise.all([
    tx.user.update({ where: { id: hostId }, data: { coins: { decrement: bet } } }),
    tx.user.update({ where: { id: guestId }, data: { coins: { decrement: bet } } }),
  ]);
}

/** Refund both players (used for cancel / draw). */
export async function refundBet(
  tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  hostId: string,
  guestId: string,
  bet: number
) {
  await Promise.all([
    tx.user.update({ where: { id: hostId }, data: { coins: { increment: bet } } }),
    tx.user.update({ where: { id: guestId }, data: { coins: { increment: bet } } }),
  ]);
}

/** Pay the pot (2 × bet) to winner. */
export async function payoutWinner(
  tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  winnerId: string,
  bet: number
) {
  await tx.user.update({
    where: { id: winnerId },
    data: { coins: { increment: bet * 2 } },
  });
}

/** Check ACCEPTED friendship between two users (either direction). */
export async function areFriends(aId: string, bId: string): Promise<boolean> {
  const f = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: aId, addresseeId: bId },
        { requesterId: bId, addresseeId: aId },
      ],
    },
    select: { id: true },
  });
  return !!f;
}
