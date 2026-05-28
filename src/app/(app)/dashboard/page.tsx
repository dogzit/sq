"use client";

import TopBar from "@/components/TopBar";
import { SkeletonCard, SkeletonProfile } from "@/components/Skeleton";
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
        title="SIDEQUEST"
        rightAction={
          userLoading ? (
            <div className="h-4 w-16 bg-[var(--bg-card)] rounded animate-pulse" />
          ) : (
            <Link href="/profile" className="text-[var(--neon-cyan)] text-sm">
              @{user?.username}
            </Link>
          )
        }
      />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Stats Card */}
        {userLoading ? (
          <SkeletonProfile />
        ) : (
          <div className="card-cyber p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {user?.displayName}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">Level {user?.level}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--neon-green)] neon-glow-green">
                  {user?.xp} XP
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  🔥 {user?.streak} day streak
                </div>
              </div>
            </div>

            <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${xpProgress * 100}%`,
                  background: "linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta))",
                  boxShadow: "0 0 10px var(--neon-cyan)",
                }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              {user ? user.xp % 200 : 0} / {xpForNext} XP to Level {(user?.level || 1) + 1}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/lobbies" className="card-cyber p-4 text-center hover:scale-[1.02] transition-transform">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm font-semibold text-[var(--neon-cyan)]">Party Up</div>
            <div className="text-[10px] text-[var(--text-secondary)]">Join or create lobby</div>
          </Link>
          <Link href="/quests" className="card-cyber p-4 text-center hover:scale-[1.02] transition-transform">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-semibold text-[var(--neon-magenta)]">Daily Quests</div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              {questsLoading ? "..." : `${quests.length} active`}
            </div>
          </Link>
        </div>

        {/* Active Quests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Active Quests
            </h3>
            <Link href="/quests" className="text-xs text-[var(--neon-cyan)]">
              View all →
            </Link>
          </div>

          {questsLoading ? (
            <div className="space-y-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : quests.length === 0 ? (
            <div className="card-cyber p-6 text-center">
              <div className="text-3xl mb-2">🌙</div>
              <p className="text-sm text-[var(--text-secondary)]">No active quests</p>
              <p className="text-xs text-[var(--text-secondary)]">Join a lobby to generate quests!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quests.slice(0, 3).map((quest: any) => {
                const done = quest.submissions?.length > 0;
                return (
                  <Link key={quest.id} href={`/quests/${quest.id}`}>
                    <div className={`card-cyber p-4 flex items-center gap-3 ${done ? "opacity-60" : ""}`}>
                      <div className="text-2xl">
                        {quest.template?.category?.emoji || "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{quest.title}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          +{quest.xpReward} XP · {quest.difficulty}
                        </div>
                      </div>
                      {done ? (
                        <span className="text-[var(--neon-green)] text-xs font-bold">DONE ✓</span>
                      ) : (
                        <span className="text-[var(--neon-yellow)] text-xs">GO →</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
