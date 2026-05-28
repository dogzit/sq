"use client";

import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { useQuests } from "@/lib/swr";
import Link from "next/link";

const diffColors: Record<string, string> = {
  EASY: "text-[var(--neon-green)]",
  MEDIUM: "text-[var(--neon-cyan)]",
  HARD: "text-[var(--neon-yellow)]",
  LEGENDARY: "text-[var(--neon-magenta)]",
};

export default function QuestsPage() {
  const { quests, isLoading } = useQuests();

  function timeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m left`;
  }

  return (
    <>
      <TopBar title="QUESTS" />

      <div className="px-4 py-4 space-y-3 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">
            Daily Challenges
          </h2>
          <span className="text-xs text-[var(--neon-cyan)]">
            {isLoading ? "..." : `${quests.length} active`}
          </span>
        </div>

        {isLoading ? (
          <SkeletonList count={4} />
        ) : quests.length === 0 ? (
          <div className="card-cyber p-8 text-center">
            <div className="text-5xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No Active Quests</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Join a lobby and generate quests to start earning XP!
            </p>
            <Link href="/lobbies" className="btn-neon inline-block mt-4 text-sm">
              Find a Lobby →
            </Link>
          </div>
        ) : (
          quests.map((quest: any) => {
            const done = quest.submissions?.length > 0;
            return (
              <Link key={quest.id} href={`/quests/${quest.id}`}>
                <div className={`card-cyber p-4 transition-transform hover:scale-[1.01] ${done ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl mt-0.5">
                      {quest.questType === "EMERGENCY" ? "⚡" : quest.template?.category?.emoji || "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold truncate">{quest.title}</h3>
                        {done && <span className="text-[var(--neon-green)] text-xs">✓</span>}
                        {quest.questType === "EMERGENCY" && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={diffColors[quest.difficulty] || ""}>
                          {quest.difficulty}
                        </span>
                        <span className="text-[var(--neon-green)]">+{quest.xpReward} XP</span>
                        <span className="text-[var(--text-secondary)]">{timeLeft(quest.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
