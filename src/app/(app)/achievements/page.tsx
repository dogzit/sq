"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import { AchievementCelebration } from "@/components/AchievementCelebration";
import { useAchievements, useUser } from "@/lib/swr";

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

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: string;
  xpReward: number;
  coinReward: number;
}

interface UserAchievement {
  achievementId: string;
  claimed: boolean;
  unlockedAt: string;
}

export default function AchievementsPage() {
  const { achievements, unlocked, isLoading, mutate } = useAchievements();
  const { mutate: mutateUser } = useUser();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<Achievement | null>(null);

  const unlockedMap = useMemo(() => {
    const m = new Map<string, UserAchievement>();
    (unlocked as UserAchievement[]).forEach((u) => m.set(u.achievementId, u));
    return m;
  }, [unlocked]);

  // Sort: claimable (unlocked, not yet claimed) → claimed → still locked
  const sorted = useMemo(() => {
    return [...(achievements as Achievement[])].sort((a, b) => {
      const ua = unlockedMap.get(a.id);
      const ub = unlockedMap.get(b.id);
      const ra = ua ? (ua.claimed ? 1 : 0) : 2;
      const rb = ub ? (ub.claimed ? 1 : 0) : 2;
      return ra - rb;
    });
  }, [achievements, unlockedMap]);

  const claimableCount = (unlocked as UserAchievement[]).filter((u) => !u.claimed).length;
  const claimedCount = (unlocked as UserAchievement[]).filter((u) => u.claimed).length;

  async function handleClaim(ach: Achievement) {
    if (claiming) return;
    setClaiming(ach.id);
    try {
      const res = await fetch("/api/achievements/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId: ach.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Авч чадсангүй");
        return;
      }
      setCelebrate(ach);
      mutate();
      mutateUser();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    } finally {
      setClaiming(null);
    }
  }

  return (
    <>
      <TopBar title="Achievements" showBack />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Summary */}
        <AnimatedItem>
          <div className="game-card p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Авсан</div>
              <div className="font-mono text-2xl font-bold text-neon-purple">
                {claimedCount}{" "}
                <span className="text-sm font-sans text-muted-foreground">
                  / {achievements.length}
                </span>
              </div>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </AnimatedItem>

        {claimableCount > 0 && (
          <AnimatedItem>
            <motion.div
              animate={{ boxShadow: [
                "0 0 0px rgba(124,92,255,0.0)",
                "0 0 24px rgba(124,92,255,0.55)",
                "0 0 0px rgba(124,92,255,0.0)",
              ] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl border border-neon-purple/50 bg-neon-purple/10 px-4 py-3 flex items-center gap-3"
            >
              <div className="text-2xl">🎁</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-neon-purple">
                  {claimableCount} шинэ achievement бэлэн!
                </div>
                <div className="text-xs text-muted-foreground">
                  Шагналаа авахын тулд дарна уу
                </div>
              </div>
            </motion.div>
          </AnimatedItem>
        )}

        {isLoading ? (
          <AnimatedItem><SkeletonList count={5} /></AnimatedItem>
        ) : (
          <AnimatedItem>
            <div className="space-y-2">
              {sorted.map((ach) => {
                const ua = unlockedMap.get(ach.id);
                const isUnlocked = !!ua;
                const isClaimable = isUnlocked && !ua!.claimed;
                const isClaimed = isUnlocked && ua!.claimed;
                const rc = rarityColor[ach.rarity] || rarityColor.COMMON;
                const rt = rarityText[ach.rarity] || rarityText.COMMON;

                return (
                  <motion.div
                    key={ach.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`game-card p-4 flex items-center gap-3 ${rc} ${
                      !isUnlocked ? "opacity-50 grayscale" : ""
                    } ${isClaimable ? "ring-2 ring-neon-purple/60 shadow-[0_0_20px_rgba(124,92,255,0.35)]" : ""}`}
                  >
                    {isClaimable ? (
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        className="text-2xl flex-shrink-0"
                      >
                        {ach.iconEmoji}
                      </motion.div>
                    ) : (
                      <div className="text-2xl flex-shrink-0">{ach.iconEmoji}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{ach.name}</h3>
                        {isClaimed && (
                          <span className="text-[10px] text-neon-green font-bold">CLAIMED</span>
                        )}
                        {isClaimable && (
                          <span className="text-[10px] text-neon-purple font-bold animate-pulse">
                            БЭЛЭН!
                          </span>
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
                    {isClaimable ? (
                      <button
                        onClick={() => handleClaim(ach)}
                        disabled={claiming === ach.id}
                        className="relative overflow-hidden text-xs py-2 px-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold whitespace-nowrap shadow-[0_0_16px_rgba(124,92,255,0.55)] hover:shadow-[0_0_24px_rgba(124,92,255,0.8)] transition-shadow"
                      >
                        <span className="relative z-10">
                          {claiming === ach.id ? "..." : "АВАХ"}
                        </span>
                        <motion.div
                          className="absolute inset-0 -translate-x-full"
                          animate={{ translateX: ["-100%", "200%"] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                          }}
                        />
                      </button>
                    ) : isClaimed ? (
                      <span className="text-neon-green text-lg">✓</span>
                    ) : (
                      <span className="text-muted-foreground text-lg">🔒</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatedItem>
        )}
      </AnimatedList>

      <AchievementCelebration
        achievement={celebrate}
        onClose={() => setCelebrate(null)}
      />
    </>
  );
}
