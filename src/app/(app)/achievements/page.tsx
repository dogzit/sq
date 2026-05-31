"use client";

import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import { useAchievements } from "@/lib/swr";

const rarityColor: Record<string, string> = {
  COMMON: "border-border",
  RARE: "border-neon-blue/40",
  EPIC: "border-neon-purple/50 shadow-[0_0_12px_rgba(124,92,255,0.15)]",
  LEGENDARY: "border-neon-gold/50 shadow-[0_0_16px_rgba(255,200,50,0.2)]",
};

const rarityText: Record<string, string> = {
  COMMON: "text-muted-foreground",
  RARE: "text-neon-blue",
  EPIC: "text-neon-purple",
  LEGENDARY: "text-neon-gold",
};

export default function AchievementsPage() {
  const { achievements, unlocked, isLoading } = useAchievements();

  const unlockedIds = new Set(unlocked.map((u: any) => u.achievementId));

  return (
    <>
      <TopBar title="Achievements" showBack />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Summary */}
        <AnimatedItem>
          <div className="game-card p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Unlocked</div>
              <div className="font-mono text-2xl font-bold text-neon-purple">
                {unlocked.length} <span className="text-sm font-sans text-muted-foreground">/ {achievements.length}</span>
              </div>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </AnimatedItem>

        {isLoading ? (
          <AnimatedItem><SkeletonList count={5} /></AnimatedItem>
        ) : (
          <AnimatedItem>
            <div className="space-y-2">
              {achievements.map((ach: any) => {
                const isUnlocked = unlockedIds.has(ach.id);
                const rc = rarityColor[ach.rarity] || rarityColor.COMMON;
                const rt = rarityText[ach.rarity] || rarityText.COMMON;

                return (
                  <div
                    key={ach.id}
                    className={`game-card p-4 flex items-center gap-3 ${rc} ${
                      !isUnlocked ? "opacity-50 grayscale" : ""
                    }`}
                  >
                    <div className="text-2xl flex-shrink-0">{ach.iconEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{ach.name}</h3>
                        {isUnlocked && (
                          <span className="text-[10px] text-neon-green font-bold">UNLOCKED</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{ach.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ach.xpReward > 0 && (
                          <span className={`text-[10px] font-mono ${rt}`}>
                            +{ach.xpReward} XP
                          </span>
                        )}
                        {ach.coinReward > 0 && (
                          <span className={`text-[10px] font-mono ${rt}`}>
                            +{ach.coinReward} 🪙
                          </span>
                        )}
                      </div>
                    </div>
                    {isUnlocked ? (
                      <span className="text-neon-green text-lg">✓</span>
                    ) : (
                      <span className="text-muted-foreground text-lg">🔒</span>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimatedItem>
        )}
      </AnimatedList>
    </>
  );
}
