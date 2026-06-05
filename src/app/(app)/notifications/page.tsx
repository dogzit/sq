"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import { useNotifications } from "@/lib/swr";
import { formatTimeAgo } from "@/lib/utils";
import PushToggle from "@/components/PushToggle";

const typeIcons: Record<string, string> = {
  vote_needed: "🗳️",
  submission_approved: "✅",
  submission_rejected: "❌",
  buff_received: "✨",
  debuff_received: "💀",
  lobby_invite: "📩",
  achievement_unlocked: "🏆",
  quest_assigned: "⚡",
  friend_request: "👋",
  friend_accepted: "🤝",
  TRIVIA_APPROVED: "✅",
  TRIVIA_REJECTED: "❌",
  TRIVIA_PENDING: "🧠",
  SAFE_MODE_DAILY_XP: "🏕️",
  game_challenge: "🎮",
  game_accepted: "🎮",
  game_declined: "❌",
  chat_mention: "📣",
  chat_reply: "💬",
};

function notificationHref(type: string, metadata: Record<string, unknown> | null | undefined): string | null {
  const m = (metadata ?? {}) as Record<string, unknown>;
  const questId = typeof m.questId === "string" ? m.questId : null;
  const lobbyId = typeof m.lobbyId === "string" ? m.lobbyId : null;
  const username = typeof m.username === "string" ? m.username : null;
  const matchId = typeof m.matchId === "string" ? m.matchId : null;

  switch (type) {
    case "game_challenge":
    case "game_accepted":
    case "game_declined":
      return matchId ? (type === "game_challenge" ? `/games` : `/games/${matchId}`) : "/games";
    case "vote_needed":
    case "submission_approved":
    case "submission_rejected":
    case "quest_assigned":
      return questId ? `/quests/${questId}` : null;
    case "lobby_invite":
    case "chat_mention":
    case "chat_reply":
      return lobbyId ? `/lobbies/${lobbyId}` : "/lobbies";
    case "friend_request":
    case "friend_accepted":
      return username ? `/users/${username}` : "/profile";
    case "buff_received":
    case "debuff_received":
      return "/profile";
    case "achievement_unlocked":
      return "/achievements";
    case "TRIVIA_APPROVED":
    case "TRIVIA_REJECTED":
      return "/trivia";
    case "TRIVIA_PENDING":
      return "/admin/trivia";
    case "QUEST_TEMPLATE_APPROVED":
      return questId ? `/quests/${questId}` : "/quests/mine";
    case "QUEST_TEMPLATE_REJECTED":
      return "/quests/mine";
    case "QUEST_TEMPLATE_PENDING":
      return "/admin/quest-templates";
    case "SAFE_MODE_DAILY_XP":
      return "/safe-mode";
    default:
      return null;
  }
}

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

function dayBucket(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  const week = new Date(today);
  week.setDate(week.getDate() - 7);
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  if (t.getTime() === today.getTime()) return "Өнөөдөр";
  if (t.getTime() === y.getTime()) return "Өчигдөр";
  if (t > week) return "Энэ долоо хоног";
  return "Хуучин";
}

export default function NotificationsPage() {
  const { notifications, isLoading, mutate, unreadCount } = useNotifications();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered: Notif[] = useMemo(() => {
    if (filter === "unread") return notifications.filter((n: Notif) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const groups = useMemo(() => {
    const out: { label: string; items: Notif[] }[] = [];
    for (const n of filtered) {
      const label = dayBucket(new Date(n.createdAt));
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [filtered]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
    mutate();
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    mutate();
  }

  function handleClick(notif: { id: string; read: boolean; type: string; metadata: Record<string, unknown> | null }) {
    if (!notif.read) markRead(notif.id);
    const href = notificationHref(notif.type, notif.metadata);
    if (href) router.push(href);
  }

  return (
    <>
      <TopBar
        showBack
        title="Notifications"
        rightAction={
          notifications.length > 0 ? (
            <button
              onClick={markAllRead}
              className="text-xs text-neon-purple font-medium hover:underline"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      <AnimatedList className="px-4 py-4 space-y-2 max-w-2xl mx-auto pb-24">
        <AnimatedItem><PushToggle /></AnimatedItem>

        {/* Filter tabs */}
        {notifications.length > 0 && (
          <AnimatedItem>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === "all"
                    ? "bg-neon-purple text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Бүгд ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === "unread"
                    ? "bg-neon-purple text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Уншаагүй ({unreadCount})
              </button>
            </div>
          </AnimatedItem>
        )}

        {isLoading ? (
          <AnimatedItem><SkeletonList count={5} /></AnimatedItem>
        ) : filtered.length === 0 ? (
          <AnimatedItem>
            <div className="game-card p-8 text-center">
              <div className="text-3xl mb-2">🔔</div>
              <div className="text-sm text-muted-foreground">
                {filter === "unread" ? "Уншаагүй мэдэгдэл алга" : "No notifications yet"}
              </div>
            </div>
          </AnimatedItem>
        ) : (
          groups.map((group) => (
            <AnimatedItem key={group.label}>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-1 pt-1">
                  {group.label}
                </div>
                {group.items.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`game-card p-4 w-full text-left flex items-start gap-3 transition-all ${
                      !notif.read ? "border-neon-purple/30 bg-neon-purple/5" : "opacity-60"
                    }`}
                  >
                    <div className="text-xl flex-shrink-0 mt-0.5">
                      {typeIcons[notif.type] || "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{notif.title}</h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(new Date(notif.createdAt))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-neon-purple flex-shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </AnimatedItem>
          ))
        )}
      </AnimatedList>
    </>
  );
}
