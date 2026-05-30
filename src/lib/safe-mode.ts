// ──────────────────────────────────────────────
//  CAMPING PASS — Safe Mode constants
// ──────────────────────────────────────────────

export const SAFE_MODE_COIN_PER_DAY = 50;
export const SAFE_MODE_MIN_DAYS = 1;
export const SAFE_MODE_MAX_DAYS = 7;
export const SAFE_MODE_DAILY_XP = 10;

export function calculateCampingPassCost(days: number): number {
  return days * SAFE_MODE_COIN_PER_DAY;
}

export function isValidDays(days: unknown): days is number {
  return (
    typeof days === "number" &&
    Number.isInteger(days) &&
    days >= SAFE_MODE_MIN_DAYS &&
    days <= SAFE_MODE_MAX_DAYS
  );
}
