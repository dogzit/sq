"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { AnimatedItem } from "@/components/AnimatedList";
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

type FeedPage = { events: FeedEvent[]; nextCursor: string | null };

const rarityColor: Record<string, string> = {
  COMMON: "text-muted-foreground",
  RARE: "text-neon-blue",
  EPIC: "text-neon-purple",
  LEGENDARY: "text-neon-gold",
};

function getKey(pageIndex: number, previous: FeedPage | null) {
  if (previous && previous.nextCursor === null) return null; // exhausted
  if (pageIndex === 0) return "/api/feed";
  if (!previous?.nextCursor) return null;
  return `/api/feed?cursor=${encodeURIComponent(previous.nextCursor)}`;
}

export default function FeedPage() {
  const { data, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<FeedPage>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      // Keep already-loaded pages while a new page loads — no jank.
      keepPreviousData: true,
    });

  const events: FeedEvent[] = useMemo(
    () => (data ?? []).flatMap((p) => p?.events ?? []),
    [data],
  );

  const lastPage = data?.[data.length - 1];
  const hasMore = lastPage ? lastPage.nextCursor !== null : true;
  const loadingMore = isValidating && (data?.length ?? 0) > 0;

  // ── IntersectionObserver to auto-load next page ──
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadNext = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setSize((s) => s + 1);
  }, [hasMore, loadingMore, setSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadNext();
      },
      { rootMargin: "300px 0px" }, // start loading before sentinel hits the viewport
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadNext]);

  return (
    <>
      <TopBar
        title="Найзууд"
        showBack
        rightAction={
          <button
            onClick={() => mutate()}
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            ↻
          </button>
        }
      />

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto pb-24">
        {isLoading && events.length === 0 ? (
          <FeedSkeleton />
        ) : events.length === 0 ? (
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
        ) : (
          <>
            {events.map((e) => (
              <AnimatedItem key={e.id}>
                <FeedRow event={e} />
              </AnimatedItem>
            ))}

            {/* Sentinel & loader */}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && <FeedSkeleton compact />}
            {!hasMore && events.length > 0 && (
              <div className="text-center text-[11px] text-muted-foreground py-6">
                Дууссан · {events.length} event
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ────────────────────────────────────────── */

function FeedRow({ event: e }: { event: FeedEvent }) {
  if (e.kind === "submission") {
    return (
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
        <MediaPreview url={e.mediaUrl} type={e.mediaType} />
        {e.caption && (
          <p className="text-xs text-muted-foreground mt-2">{e.caption}</p>
        )}
      </Link>
    );
  }

  return (
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
  );
}

/** Lazy-load media via native browser hints to avoid bandwidth waste during scroll. */
function MediaPreview({ url, type }: { url: string; type: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);

  // Pause off-screen videos so memory doesn't balloon as the feed grows.
  useEffect(() => {
    if (type !== "VIDEO") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const node = sourceRef.current as HTMLVideoElement | null;
        if (!node) return;
        for (const en of entries) {
          if (en.isIntersecting) {
            // gentle: don't autoplay, just preload metadata when in view
            node.preload = "metadata";
          } else {
            node.pause();
          }
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [type]);

  return (
    <div ref={ref} className="rounded-xl overflow-hidden bg-black aspect-video">
      {type === "VIDEO" ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={(n) => { sourceRef.current = n; }}
          src={url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="none"
          controls={false}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={(n) => { sourceRef.current = n as unknown as HTMLImageElement; }}
          src={url}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

function FeedSkeleton({ compact = false }: { compact?: boolean }) {
  const rows = compact ? 1 : 3;
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="game-card p-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full skeleton-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded skeleton-shimmer" />
              <div className="h-2 w-20 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="aspect-video rounded-xl skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
