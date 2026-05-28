"use client";

import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { useLeaderboard } from "@/lib/swr";

const rankEmoji = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { leaderboard, isLoading } = useLeaderboard();

  return (
    <>
      <TopBar title="LEADERBOARD" showBack />

      <div className="px-4 py-4 space-y-2 max-w-lg mx-auto">
        {isLoading ? (
          <SkeletonList count={5} />
        ) : (
          leaderboard.map((entry: any) => (
            <div
              key={entry.id}
              className={`card-cyber p-4 flex items-center gap-3 ${
                entry.rank <= 3 ? "neon-border" : ""
              }`}
            >
              <div className="w-8 text-center text-lg font-bold">
                {entry.rank <= 3 ? rankEmoji[entry.rank - 1] : (
                  <span className="text-[var(--text-secondary)] text-sm">#{entry.rank}</span>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--neon-cyan)]/20 flex items-center justify-center text-sm font-bold text-[var(--neon-cyan)]">
                {entry.displayName[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{entry.displayName}</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  @{entry.username} · Lvl {entry.level} · 🔥{entry.streak}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[var(--neon-green)] neon-glow-green">
                  {entry.xp}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">XP</div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
