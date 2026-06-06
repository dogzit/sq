"use client";

import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useQuests } from "@/lib/swr";
import Link from "next/link";
import QuestCard, { sortQuestsByDoneLast } from "@/components/QuestCard";

export default function QuestsPage() {
  const { quests, isLoading } = useQuests();

  return (
    <>
      <TopBar
        title="Quests"
        showBack
        rightAction={
          <Link
            href="/quests/mine"
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-neon-purple/15 text-neon-purple"
          >
            Минийх
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Daily Challenges
          </h2>
          <span className="pill bg-neon-purple/10 text-neon-purple">
            {isLoading ? "..." : `${quests.length} active`}
          </span>
        </div>

        <Link
          href="/quests/create"
          className="game-card p-3.5 flex items-center justify-between border-2 border-dashed border-border hover:border-neon-purple/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="emoji-ring text-lg">➕</div>
            <div>
              <div className="text-sm font-semibold group-hover:text-neon-purple transition-colors">
                Өөрийн quest үүсгэх
              </div>
              <div className="text-[11px] text-muted-foreground">
                Админ батлахад та өөрөө шагнал авна
              </div>
            </div>
          </div>
          <span className="text-muted-foreground group-hover:text-neon-purple transition-colors">→</span>
        </Link>

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
            {sortQuestsByDoneLast(quests).map((quest: any) => (
              <AnimatedItem key={quest.id}>
                <QuestCard quest={quest} />
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </>
  );
}
