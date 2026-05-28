"use client";

import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useQuests } from "@/lib/swr";
import Link from "next/link";

const diffConfig: Record<string, { color: string; bg: string }> = {
  EASY: { color: "text-neon-green", bg: "bg-neon-green/10" },
  MEDIUM: { color: "text-blue-400", bg: "bg-blue-400/10" },
  HARD: { color: "text-neon-orange", bg: "bg-neon-orange/10" },
  LEGENDARY: { color: "text-neon-red", bg: "bg-neon-red/10" },
};

export default function QuestsPage() {
  const { quests, isLoading } = useQuests();

  function timeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <>
      <TopBar title="Quests" />

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Daily Challenges
          </h2>
          <span className="pill bg-neon-purple/10 text-neon-purple">
            {isLoading ? "..." : `${quests.length} active`}
          </span>
        </div>

        {isLoading ? (
          <SkeletonList count={4} />
        ) : quests.length === 0 ? (
          <div className="game-card p-10 text-center">
            <div className="emoji-ring mx-auto mb-4 w-16 h-16 text-2xl">🎯</div>
            <h3 className="font-display text-base font-bold mb-1">No Active Quests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join a lobby and generate quests to start earning XP!
            </p>
            <Link href="/lobbies" className="btn-game inline-block">
              Find a Lobby
            </Link>
          </div>
        ) : (
          <AnimatedList className="space-y-2">
            {quests.map((quest: any) => {
              const done = quest.submissions?.length > 0;
              const diff = diffConfig[quest.difficulty] || { color: "text-muted-foreground", bg: "bg-secondary" };
              return (
                <AnimatedItem key={quest.id}>
                  <Link href={`/quests/${quest.id}`}>
                    <div className={`game-card p-4 ${done ? "opacity-50" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className="emoji-ring text-lg flex-shrink-0">
                          {quest.questType === "EMERGENCY" ? "⚡" : quest.template?.category?.emoji || "🎯"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold truncate">{quest.title}</h3>
                            {done && <span className="pill bg-neon-green/10 text-neon-green">✓</span>}
                            {quest.questType === "EMERGENCY" && (
                              <span className="pill bg-neon-red/15 text-neon-red animate-glow-pulse">
                                EMERGENCY
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {quest.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`pill ${diff.bg} ${diff.color}`}>
                              {quest.difficulty}
                            </span>
                            <span className="pill bg-neon-gold/10 text-neon-gold">
                              ⚡ {quest.xpReward}
                            </span>
                            <span className="pill bg-secondary text-muted-foreground">
                              {timeLeft(quest.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedItem>
              );
            })}
          </AnimatedList>
        )}
      </div>
    </>
  );
}
