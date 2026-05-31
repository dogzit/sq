import { prisma } from "@/lib/db";
import { calculateLevel } from "@/lib/economy";

/** Check and award achievements for a user after an action */
export async function checkAchievements(userId: string, context: {
  questCompleted?: boolean;
  isEmergencyQuest?: boolean;
  votesCast?: number;
  lobbiesJoined?: number;
  coinsSpent?: number;
  newLevel?: number;
  newStreak?: number;
  profileCompleted?: boolean;
}) {
  const unlocked: string[] = [];

  // Get all achievements and user's existing unlocks
  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const achievementMap = new Map(allAchievements.map((a) => [a.key, a]));

  async function tryUnlock(key: string) {
    const ach = achievementMap.get(key);
    if (!ach || unlockedIds.has(ach.id)) return;

    await prisma.$transaction(async (tx) => {
      await tx.userAchievement.create({
        data: { userId, achievementId: ach.id },
      });
      if (ach.xpReward > 0 || ach.coinReward > 0) {
        const userBefore = await tx.user.findUnique({
          where: { id: userId },
          select: { xp: true },
        });
        const newXp = (userBefore?.xp ?? 0) + ach.xpReward;
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(ach.xpReward > 0 && { xp: newXp, level: calculateLevel(newXp) }),
            ...(ach.coinReward > 0 && { coins: { increment: ach.coinReward } }),
          },
        });
      }
    });
    unlockedIds.add(ach.id);
    unlocked.push(key);
  }

  // First Quest
  if (context.questCompleted) {
    const totalQuests = await prisma.questSubmission.count({
      where: { userId, vetoStatus: "APPROVED" },
    });
    if (totalQuests >= 1) await tryUnlock("first_quest");
  }

  // Emergency Hero
  if (context.isEmergencyQuest) {
    await tryUnlock("emergency");
  }

  // Streak achievements
  if (context.newStreak !== undefined) {
    if (context.newStreak >= 7) await tryUnlock("streak_7");
    if (context.newStreak >= 30) await tryUnlock("streak_30");
  }

  // Level achievements
  if (context.newLevel !== undefined) {
    if (context.newLevel >= 10) await tryUnlock("level_10");
  }

  // Voter achievements
  if (context.votesCast !== undefined) {
    const totalVotes = await prisma.vetoVote.count({ where: { voterId: userId } });
    if (totalVotes >= 10) await tryUnlock("voter_10");
    if (totalVotes >= 50) await tryUnlock("voter_50");
  }

  // Social Butterfly (3 lobbies)
  if (context.lobbiesJoined !== undefined) {
    const lobbyCount = await prisma.lobbyMember.count({ where: { userId } });
    if (lobbyCount >= 3) await tryUnlock("social_3");
  }

  // Big Spender (1000 coins spent)
  if (context.coinsSpent !== undefined) {
    // We track total spent as sum of all purchases
    const totalSpent = await prisma.userShopItem.findMany({
      where: { userId },
      include: { item: { select: { price: true } } },
    });
    const spent = totalSpent.reduce((sum, p) => sum + p.item.price, 0);
    if (spent >= 1000) await tryUnlock("big_spender");
  }

  // Profile completed
  if (context.profileCompleted) {
    await tryUnlock("profile_complete");
  }

  return unlocked;
}
