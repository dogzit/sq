"use client";

import useSWR from "swr";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { formatTimeAgo } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type UserLite = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  equippedFrameValue?: string | null;
};

type FeedEvent =
  | {
      kind: "submission";
      id: string;
      at: string;
      user: UserLite;
      quest: { id: string; title: string } | null;
      mediaUrl: string;
      mediaType: "IMAGE" | "VIDEO";
      xpAwarded: number;
      caption: string | null;
    }
  | {
      kind: "achievement";
      id: string;
      at: string;
      user: UserLite;
      achievement: { name: string; iconEmoji: string; rarity: string };
    };

const rarityColor: Record<string, string> = {
  COMMON: "text-muted-foreground",
  RARE: "text-neon-blue",
  EPIC: "text-neon-purple",
  LEGENDARY: "text-neon-gold",
};

export default function FeedPage() {
  const { data, isLoading } = useSWR<{ events: FeedEvent[] }>("/api/feed", fetcher, {
    refreshInterval: 60000,
  });
  const events = data?.events ?? [];

  return (
    <>
      <TopBar title="Найзууд" showBack />

      <AnimatedList className="px-4 py-4 space-y-3 max-w-2xl mx-auto pb-24">
        {isLoading ? (
          <AnimatedItem>
            <div className="game-card p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading...
            </div>
          </AnimatedItem>
        ) : events.length === 0 ? (
          <AnimatedItem>
            <div className="game-card p-10 text-center space-y-2">
              <div className="text-3xl">📭</div>
              <div className="text-sm text-muted-foreground">
                Найзуудын идэвхжил алга. Найз нэмэхийн тулд{" "}
                <Link href="/users" className="text-neon-purple">
                  Хүмүүс
                </Link>{" "}
                рүү ороорой.
              </div>
            </div>
          </AnimatedItem>
        ) : (
          events.map((e) => (
            <AnimatedItem key={e.id}>
              {e.kind === "submission" ? (
                <Link
                  href={e.quest ? `/quests/${e.quest.id}` : "#"}
                  className="game-card p-3 block hover:ring-1 hover:ring-neon-purple/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <UserAvatar user={e.user} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-semibold">{e.user.displayName}</span>
                        <span className="text-muted-foreground"> · quest биелүүллээ</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(new Date(e.at))} ·{" "}
                        <span className="text-neon-gold">+{e.xpAwarded} XP</span>
                      </div>
                    </div>
                  </div>
                  {e.quest && (
                    <div className="text-xs font-semibold text-foreground mb-2">
                      {e.quest.title}
                    </div>
                  )}
                  <div className="rounded-xl overflow-hidden bg-black aspect-video">
                    {e.mediaType === "VIDEO" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <video src={e.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.mediaUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  {e.caption && (
                    <p className="text-xs text-muted-foreground mt-2">{e.caption}</p>
                  )}
                </Link>
              ) : (
                <div className="game-card p-3 flex items-center gap-3">
                  <UserAvatar user={e.user} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{e.user.displayName}</span>
                      <span className="text-muted-foreground"> · achievement нээлээ</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-base">{e.achievement.iconEmoji}</span>
                      <span className={`text-xs font-semibold ${rarityColor[e.achievement.rarity]}`}>
                        {e.achievement.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(new Date(e.at))}
                  </span>
                </div>
              )}
            </AnimatedItem>
          ))
        )}
      </AnimatedList>
    </>
  );
}
