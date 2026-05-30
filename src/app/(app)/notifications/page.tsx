"use client";

import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import { useNotifications } from "@/lib/swr";
import { formatTimeAgo } from "@/lib/utils";

const typeIcons: Record<string, string> = {
  vote_needed: "🗳️",
  submission_approved: "✅",
  submission_rejected: "❌",
  buff_received: "✨",
  debuff_received: "💀",
  lobby_invite: "📩",
  achievement_unlocked: "🏆",
  quest_assigned: "⚡",
};

export default function NotificationsPage() {
  const { notifications, isLoading, mutate } = useNotifications();

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
        {isLoading ? (
          <AnimatedItem><SkeletonList count={5} /></AnimatedItem>
        ) : notifications.length === 0 ? (
          <AnimatedItem>
            <div className="game-card p-8 text-center">
              <div className="text-3xl mb-2">🔔</div>
              <div className="text-sm text-muted-foreground">No notifications yet</div>
            </div>
          </AnimatedItem>
        ) : (
          notifications.map((notif: any) => (
            <AnimatedItem key={notif.id}>
              <button
                onClick={() => !notif.read && markRead(notif.id)}
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
            </AnimatedItem>
          ))
        )}
      </AnimatedList>
    </>
  );
}
