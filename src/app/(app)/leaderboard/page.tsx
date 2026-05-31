"use client";

import Link from "next/link";
import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import UserAvatar from "@/components/UserAvatar";
import { useLeaderboard } from "@/lib/swr";

const rankEmoji = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { leaderboard, isLoading } = useLeaderboard();

  return (
    <>
      <TopBar
        title="Leaderboard"
        showBack
        rightAction={
          <Link
            href="/users"
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-neon-purple/10 text-neon-purple"
          >
            Хүмүүс
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-2 max-w-2xl mx-auto">
        {isLoading ? (
          <SkeletonList count={5} />
        ) : (
          <AnimatedList className="space-y-2">
            {leaderboard.map((entry: any) => (
              <AnimatedItem key={entry.id}>
                <Link
                  href={`/users/${entry.username}`}
                  className={`game-card p-3.5 flex items-center gap-3 hover:border-neon-purple/40 transition-all ${entry.rank <= 3 ? "ring-1 ring-neon-purple/20" : ""}`}
                >
                  <div className="w-8 text-center text-lg font-bold flex-shrink-0">
                    {entry.rank <= 3 ? rankEmoji[entry.rank - 1] : (
                      <span className="text-muted-foreground text-sm font-mono">#{entry.rank}</span>
                    )}
                  </div>
                  <UserAvatar user={entry} size={40} linkToProfile={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{entry.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      @{entry.username} · Lvl {entry.level} · {entry.streak} streak
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-base font-bold text-neon-gold text-glow-gold">
                      {entry.xp}
                    </div>
                    <div className="text-[10px] text-muted-foreground">XP</div>
                  </div>
                </Link>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </>
  );
}
