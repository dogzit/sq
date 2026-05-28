"use client";

import TopBar from "@/components/TopBar";
import { SkeletonCard, SkeletonProfile } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem, FadeIn } from "@/components/AnimatedList";
import { useUser, useQuests } from "@/lib/swr";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const { quests, isLoading: questsLoading } = useQuests();

  const xpForNext = (user?.level || 1) * 200;
  const xpProgress = user ? (user.xp % 200) / 200 : 0;

  return (
    <>
      <TopBar
        title="SideQuest"
        rightAction={
          userLoading ? (
            <div className="h-4 w-16 skeleton-shimmer rounded-lg" />
          ) : (
            <Link href="/profile" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-neon-purple/15 ring-2 ring-neon-purple/30 flex items-center justify-center text-xs font-bold text-neon-purple group-hover:ring-neon-purple/60 transition-all">
                {user?.displayName?.[0]}
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
                  <p className="text-xs text-muted-foreground">Level {user?.level}</p>
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
                {user ? user.xp % 200 : 0} / {xpForNext} XP to Level {(user?.level || 1) + 1}
              </p>
            </div>
          )}
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
          </div>
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
                      <div className="emoji-ring">
                        {quest.template?.category?.emoji || "🎯"}
                      </div>
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
