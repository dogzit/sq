"use client";

import TopBar from "@/components/TopBar";
import { SkeletonCard, SkeletonProfile } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem, FadeIn } from "@/components/AnimatedList";
import { useState } from "react";
import { useUser, useQuests, useCheckIn } from "@/lib/swr";
import useSWR from "swr";
import { xpForLevel, calculateLevel, levelProgress, xpToNextLevel } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface PushupStatusLite {
  unlocked: boolean;
  daysLeft: number;
  coinsPerRep: number;
}

const pushupFetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { user, isLoading: userLoading, mutate: mutateUser } = useUser();
  const { quests, isLoading: questsLoading } = useQuests();
  const { checkedInToday, pendingReward, pendingXpReward, streak, nextMilestone, mutate: mutateCheckIn } = useCheckIn();
  const { data: pushupStatus } = useSWR<PushupStatusLite>(
    "/api/pushups/status",
    pushupFetcher,
  );
  const [checkingIn, setCheckingIn] = useState(false);

  async function handleCheckIn() {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/checkin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Check-in хийж чадсангүй");
        return;
      }
      toast.success(
        `+${data.reward} 🪙 · +${data.xpReward} XP! Streak: ${data.streak} хоног`,
      );
      mutateCheckIn();
      mutateUser();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    } finally {
      setCheckingIn(false);
    }
  }

  const userXp = user?.xp || 0;
  const currentLevel = user ? calculateLevel(userXp) : 1;
  const xpProgress = user ? levelProgress(userXp) : 0;
  const xpRemaining = user ? xpToNextLevel(userXp) : 0;
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);

  return (
    <>
      <TopBar
        title="SideQuest"
        rightAction={
          userLoading ? (
            <div className="h-4 w-16 skeleton-shimmer rounded-lg" />
          ) : (
            <Link href="/profile" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full ring-2 ring-neon-purple/30 group-hover:ring-neon-purple/60 transition-all overflow-hidden bg-neon-purple/15 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-neon-purple">
                    {user?.displayName?.[0]}
                  </span>
                )}
              </div>
            </Link>
          )
        }
      />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Stats Card */}
        <AnimatedItem>
          {userLoading ? (
            <SkeletonProfile />
          ) : (
            <div className="game-card p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {user?.displayName}
                  </h2>
                  <p className="text-xs text-muted-foreground">Level {currentLevel}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-bold text-neon-gold text-glow-gold">
                    {user?.xp} <span className="text-xs font-sans font-normal text-muted-foreground">XP</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.streak} day streak
                  </div>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${xpProgress * 100}%`,
                    background: "linear-gradient(90deg, #7C5CFF, #2DD4FF)",
                    boxShadow: "0 0 12px rgba(124, 92, 255, 0.4)",
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {userXp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP to Level {currentLevel + 1}
                {user && user.streak > 0 && (
                  <span className="ml-2 text-neon-orange">+{Math.min(user.streak, 30)}% streak</span>
                )}
              </p>
            </div>
          )}
        </AnimatedItem>

        {/* Daily Check-In */}
        <AnimatedItem>
          <div className="game-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="emoji-ring">{checkedInToday ? "✅" : "🎁"}</div>
              <div>
                <div className="text-sm font-semibold">Daily Check-In</div>
                <div className="text-[11px] text-muted-foreground">
                  {checkedInToday
                    ? "Claimed today!"
                    : `+${pendingReward} 🪙 · +${pendingXpReward} XP${nextMilestone ? ` · ${nextMilestone} day milestone soon` : ""}`
                  }
                </div>
              </div>
            </div>
            {!checkedInToday && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="btn-game text-xs px-4 py-2"
              >
                {checkingIn ? "..." : "Claim"}
              </button>
            )}
          </div>
        </AnimatedItem>

        {/* Quick Actions */}
        <AnimatedItem>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/lobbies" className="game-card p-4 text-center group">
              <div className="emoji-ring mx-auto mb-2">👥</div>
              <div className="text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors">Party Up</div>
              <div className="text-[11px] text-muted-foreground">Join or create lobby</div>
            </Link>
            <Link href="/quests" className="game-card p-4 text-center group">
              <div className="emoji-ring mx-auto mb-2">⚡</div>
              <div className="text-sm font-semibold text-foreground group-hover:text-neon-blue transition-colors">Daily Quests</div>
              <div className="text-[11px] text-muted-foreground">
                {questsLoading ? "..." : `${quests.length} active`}
              </div>
            </Link>
            <Link href="/trivia" className="game-card p-4 text-center group">
              <div className="emoji-ring mx-auto mb-2">🧠</div>
              <div className="text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors">Trivia</div>
              <div className="text-[11px] text-muted-foreground">Хариулж шагнал ав</div>
            </Link>
            <Link href="/safe-mode" className="game-card p-4 text-center group">
              <div className="emoji-ring mx-auto mb-2">🏕️</div>
              <div className="text-sm font-semibold text-foreground group-hover:text-neon-green transition-colors">Camping</div>
              <div className="text-[11px] text-muted-foreground">
                {user?.isSafeMode ? "Идэвхтэй" : "Streak царца"}
              </div>
            </Link>
          </div>
        </AnimatedItem>

        {/* Pushups challenge */}
        <AnimatedItem>
          {pushupStatus ? (
            pushupStatus.unlocked ? (
              <Link
                href="/pushups"
                className="game-card p-4 flex items-center justify-between bg-gradient-to-r from-neon-purple/10 to-cyan-500/10 border-neon-purple/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className="emoji-ring">💪</div>
                  <div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors">
                      AI Push-up Challenge
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Идэвхтэй · бүр {pushupStatus.coinsPerRep}🪙 шагнал
                    </div>
                  </div>
                </div>
                <span className="pill bg-emerald-500/15 text-emerald-400 font-mono animate-pulse">
                  ● OPEN
                </span>
              </Link>
            ) : (
              <div className="game-card p-4 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <div className="emoji-ring grayscale">🔒</div>
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      AI Push-up Challenge
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-mono text-neon-purple font-bold">
                        {pushupStatus.daysLeft} хоног
                      </span>
                      -ийн дараа нээгдэнэ
                    </div>
                  </div>
                </div>
                <span className="pill bg-muted text-muted-foreground font-mono">
                  🔒 LOCKED
                </span>
              </div>
            )
          ) : null}
        </AnimatedItem>

        {/* Active Quests */}
        <AnimatedItem>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Active Quests
            </h3>
            <Link href="/quests" className="text-xs text-neon-purple font-medium hover:underline">
              View all
            </Link>
          </div>

          {questsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : quests.length === 0 ? (
            <div className="game-card p-8 text-center">
              <div className="text-4xl mb-3">🌙</div>
              <p className="font-display text-sm font-semibold text-foreground mb-1">No active quests</p>
              <p className="text-xs text-muted-foreground">Join a lobby to generate quests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quests.slice(0, 3).map((quest: any) => {
                const done = quest.submissions?.length > 0;
                return (
                  <Link key={quest.id} href={`/quests/${quest.id}`}>
                    <div className={`game-card p-3.5 flex items-center gap-3 ${done ? "opacity-50" : ""}`}>
                      <div className="emoji-ring">🎯</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{quest.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="pill bg-neon-gold/10 text-neon-gold">⚡ {quest.xpReward}</span>
                          <span className="text-[11px] text-muted-foreground">{quest.difficulty}</span>
                        </div>
                      </div>
                      {done ? (
                        <span className="pill bg-neon-green/10 text-neon-green">Done</span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
