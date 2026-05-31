export const PUSHUP_COOLDOWN_DAYS = 5;
export const COINS_PER_REP = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PushupStatus {
  unlocked: boolean;
  daysLeft: number;
  nextUnlockAt: string | null;
  lastPushupAt: string | null;
  cooldownDays: number;
  coinsPerRep: number;
}

export function computePushupStatus(
  lastPushupAt: Date | null,
  now = new Date(),
): PushupStatus {
  if (!lastPushupAt) {
    return {
      unlocked: true,
      daysLeft: 0,
      nextUnlockAt: null,
      lastPushupAt: null,
      cooldownDays: PUSHUP_COOLDOWN_DAYS,
      coinsPerRep: COINS_PER_REP,
    };
  }
  const next = new Date(
    lastPushupAt.getTime() + PUSHUP_COOLDOWN_DAYS * MS_PER_DAY,
  );
  const diffMs = next.getTime() - now.getTime();
  const unlocked = diffMs <= 0;
  return {
    unlocked,
    daysLeft: unlocked ? 0 : Math.ceil(diffMs / MS_PER_DAY),
    nextUnlockAt: next.toISOString(),
    lastPushupAt: lastPushupAt.toISOString(),
    cooldownDays: PUSHUP_COOLDOWN_DAYS,
    coinsPerRep: COINS_PER_REP,
  };
}
