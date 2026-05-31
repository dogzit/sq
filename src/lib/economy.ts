import { prisma } from "@/lib/db";
import { checkAchievements } from "@/lib/achievements";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LEVELING — Quadratic curve (RPG-style)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Cumulative XP needed to reach a given level */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * (level - 1) * level;
  // Level 2: 100, Level 3: 300, Level 5: 1000, Level 10: 4500, Level 20: 19000
}

/** Calculate level from total XP */
export function calculateLevel(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

/** XP remaining to reach next level */
export function xpToNextLevel(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  return xpForLevel(currentLevel + 1) - totalXp;
}

/** Progress fraction (0-1) within current level */
export function levelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 0;
  return (totalXp - currentLevelXp) / range;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STREAK — Consecutive days, resets on miss
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMongoliaDate(date?: Date): string {
  // Mongolia is UTC+8
  const d = date || new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const mongolia = new Date(utc + 8 * 3600000);
  return mongolia.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
}

/** Returns { newStreak, lastStreakDate } */
export function updateStreak(currentStreak: number, lastStreakDate: Date | null): {
  newStreak: number;
  lastStreakDate: Date;
} {
  const today = getMongoliaDate();
  const todayDate = new Date(today + "T00:00:00Z");

  if (!lastStreakDate) {
    return { newStreak: 1, lastStreakDate: todayDate };
  }

  const lastDate = getMongoliaDate(lastStreakDate);

  if (lastDate === today) {
    // Already counted today — no change
    return { newStreak: currentStreak, lastStreakDate };
  }

  if (lastDate === getPreviousDay(today)) {
    // Yesterday — continue streak
    return { newStreak: currentStreak + 1, lastStreakDate: todayDate };
  }

  // Missed a day — reset
  return { newStreak: 1, lastStreakDate: todayDate };
}

/** Streak XP multiplier: +1% per day, max +30% */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak, 30) * 0.01;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DAILY CHECK-IN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MILESTONE_BONUSES: Record<number, number> = { 7: 50, 14: 100, 21: 150, 28: 200 };
const MILESTONE_XP_BONUSES: Record<number, number> = { 7: 25, 14: 50, 21: 75, 28: 100 };

/** Calculate daily check-in coin reward based on streak */
export function dailyCheckInReward(streak: number): number {
  const base = 10;
  const streakBonus = Math.min(streak, 7) * 5; // 5 per streak day, max +35
  const milestoneBonus = MILESTONE_BONUSES[streak] || 0;
  return base + streakBonus + milestoneBonus;
}

/** Calculate daily check-in XP reward based on streak */
export function dailyCheckInXpReward(streak: number): number {
  const base = 5;
  const streakBonus = Math.min(streak, 7) * 3; // 3 per streak day, max +21
  const milestoneBonus = MILESTONE_XP_BONUSES[streak] || 0;
  return base + streakBonus + milestoneBonus;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COINS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DIFFICULTY_COIN_BONUS: Record<string, number> = {
  EASY: 0,
  MEDIUM: 5,
  HARD: 10,
  LEGENDARY: 20,
};

/** Calculate coin reward from a quest */
export function questCoinReward(baseXp: number, difficulty: string, multiplier: number): number {
  const bonus = DIFFICULTY_COIN_BONUS[difficulty] || 0;
  return Math.round(baseXp * 0.3 * multiplier) + bonus;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AWARD QUEST XP — Unified function
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AwardQuestXPParams {
  userId: string;
  questId: string;
  questXpReward: number;
  questDifficulty: string;
  lobbyId?: string | null;
  /** 1.0 for full, 0.4 for no-votes expired, 0.5 for partial expired */
  xpPercentage?: number;
  isEmergencyQuest?: boolean;
}

interface AwardQuestXPResult {
  xpAwarded: number;
  coinsAwarded: number;
  newLevel: number;
  newStreak: number;
}

export async function awardQuestXP(params: AwardQuestXPParams): Promise<AwardQuestXPResult> {
  const { userId, questId, questXpReward, questDifficulty, lobbyId, xpPercentage = 1.0, isEmergencyQuest = false } = params;

  // 1. Get user with current streak info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, streak: true, lastStreakDate: true },
  });
  if (!user) throw new Error("User not found");

  // 2. Gather active effects (time-based, NOT consumed)
  let multiplier = xpPercentage;

  const effects = await prisma.activeEffect.findMany({
    where: { targetId: userId, expiresAt: { gt: new Date() } },
  });
  for (const effect of effects) {
    multiplier *= effect.multiplier;
  }

  // 3. Character class bonus (AI-аар тогтоосон bonusClass)
  if (lobbyId) {
    const member = await prisma.lobbyMember.findUnique({
      where: { userId_lobbyId: { userId, lobbyId } },
    });
    if (member) {
      const quest = await prisma.quest.findUnique({
        where: { id: questId },
        select: { bonusClass: true },
      });
      if (quest?.bonusClass && quest.bonusClass === member.characterClass) {
        multiplier *= 1.25;
      }
    }
  }

  // 4. Streak multiplier
  const streakMult = streakMultiplier(user.streak);
  multiplier *= streakMult;

  // 5. Calculate rewards
  const xpAwarded = Math.round(questXpReward * multiplier);
  const coinsAwarded = questCoinReward(questXpReward, questDifficulty, multiplier);
  const newXp = user.xp + xpAwarded;
  const newLevel = calculateLevel(newXp);

  // 6. Update streak
  const { newStreak, lastStreakDate } = updateStreak(user.streak, user.lastStreakDate);

  // 7. Extend location visibility (max of existing or now+1hr)
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  const existingLocation = await prisma.userLocation.findUnique({
    where: { userId },
    select: { visibleUntil: true },
  });
  const newVisibleUntil = existingLocation?.visibleUntil && existingLocation.visibleUntil > oneHourFromNow
    ? existingLocation.visibleUntil
    : oneHourFromNow;

  // 8. Execute all updates in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        coins: { increment: coinsAwarded },
        level: newLevel,
        streak: newStreak,
        lastStreakDate,
      },
    }),
    ...(lobbyId
      ? [prisma.lobbyMember.updateMany({
          where: { userId, lobbyId },
          data: { xpInLobby: { increment: xpAwarded } },
        })]
      : []),
    prisma.userLocation.upsert({
      where: { userId },
      update: { visibleUntil: newVisibleUntil },
      create: { userId, latitude: 0, longitude: 0, visibleUntil: newVisibleUntil },
    }),
  ]);

  // 9. Check achievements (non-blocking)
  checkAchievements(userId, {
    questCompleted: true,
    isEmergencyQuest,
    newLevel,
    newStreak,
  }).catch(() => {}); // don't block on achievement check

  return { xpAwarded, coinsAwarded, newLevel, newStreak };
}
