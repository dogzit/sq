"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import { useNotifications } from "@/lib/swr";
import { formatTimeAgo } from "@/lib/utils";
import PushToggle from "@/components/PushToggle";
import { toast } from "sonner";
import { Trash2, CheckCheck, CheckSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons: Record<string, string> = {
  vote_needed: "🗳️",
  vote_approve: "👍",
  vote_reject: "👎",
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
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<
    | null
    | { kind: "single"; id: string; title: string }
    | { kind: "bulk"; count: number }
  >(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

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

  async function doDeleteOne(id: string) {
    mutate(
      (curr: any) => ({
        ...curr,
        notifications: (curr?.notifications ?? []).filter((n: Notif) => n.id !== id),
      }),
      { revalidate: false },
    );
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    if (!res.ok) toast.error("Устгаж чадсангүй");
    else toast.success("Устгалаа");
    mutate();
  }

  async function doDeleteSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    mutate(
      (curr: any) => ({
        ...curr,
        notifications: (curr?.notifications ?? []).filter(
          (n: Notif) => !selected.has(n.id),
        ),
      }),
      { revalidate: false },
    );
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: ids }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.success(`${data.deleted ?? ids.length} мэдэгдэл устлаа`);
      exitSelectMode();
    } else {
      toast.error("Устгаж чадсангүй");
    }
    mutate();
  }

  function handleClick(notif: { id: string; read: boolean; type: string; metadata: Record<string, unknown> | null }) {
    if (selectMode) {
      toggleSelect(notif.id);
      return;
    }
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
            <div className="flex items-center gap-1">
              {selectMode ? (
                <button
                  onClick={exitSelectMode}
                  title="Болих"
                  aria-label="Болих"
                  className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              ) : (
                <>
                  <button
                    onClick={markAllRead}
                    title="Бүгдийг уншсан болгох"
                    aria-label="Бүгдийг уншсан болгох"
                    className="p-2 rounded-lg text-neon-purple hover:bg-neon-purple/10 transition-colors"
                  >
                    <CheckCheck className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    onClick={() => setSelectMode(true)}
                    title="Сонгож устгах"
                    aria-label="Сонгож устгах"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <CheckSquare className="w-[18px] h-[18px]" />
                  </button>
                </>
              )}
            </div>
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
                {group.items.map((notif) => {
                  const isSelected = selected.has(notif.id);
                  return (
                    <div
                      key={notif.id}
                      className={`game-card w-full flex items-start gap-3 transition-all relative ${
                        isSelected
                          ? "ring-2 ring-destructive/60 bg-destructive/5"
                          : !notif.read
                            ? "border-neon-purple/30 bg-neon-purple/5"
                            : "opacity-60"
                      }`}
                    >
                      <button
                        onClick={() => handleClick(notif)}
                        className="flex-1 min-w-0 text-left p-4 flex items-start gap-3"
                      >
                        {selectMode && (
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-[11px] flex-shrink-0 ring-1 transition-colors ${
                              isSelected
                                ? "bg-destructive text-white ring-destructive"
                                : "bg-secondary ring-border text-transparent"
                            }`}
                            aria-hidden
                          >
                            ✓
                          </div>
                        )}
                        <div className="text-xl flex-shrink-0 mt-0.5">
                          {typeIcons[notif.type] || "🔔"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">{notif.title}</h3>
                            {!notif.read && !selectMode && (
                              <span className="w-2 h-2 rounded-full bg-neon-purple flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(new Date(notif.createdAt))}
                          </span>
                        </div>
                      </button>
                      {!selectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ kind: "single", id: notif.id, title: notif.title });
                          }}
                          title="Устгах"
                          aria-label="Устгах"
                          className="self-stretch px-3 text-muted-foreground hover:text-destructive transition-colors flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </AnimatedItem>
          ))
        )}
      </AnimatedList>

      {/* Floating action bar — sits ABOVE BottomNav while in select mode */}
      {selectMode && (
        <div
          className="fixed left-0 right-0 z-[60] px-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px)" }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-2 game-card !rounded-2xl px-3 py-2.5 shadow-lg bg-background/95 backdrop-blur-xl">
            <button
              onClick={() => setSelected(new Set(filtered.map((n) => n.id)))}
              className="text-xs px-3 py-2 rounded-xl bg-secondary text-foreground font-medium"
            >
              Бүгдийг
            </button>
            <button
              onClick={() => setSelected(new Set())}
              disabled={selected.size === 0}
              className="text-xs px-3 py-2 rounded-xl bg-secondary text-muted-foreground font-medium disabled:opacity-40"
            >
              Цэвэрлэх
            </button>
            <button
              onClick={() => selected.size > 0 && setConfirmDelete({ kind: "bulk", count: selected.size })}
              disabled={selected.size === 0}
              aria-label={`${selected.size} мэдэгдэл устгах`}
              title={`${selected.size} мэдэгдэл устгах`}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-white font-semibold disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-mono">{selected.size}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="game-card p-5 w-full max-w-xs text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">
                  {confirmDelete.kind === "bulk"
                    ? `${confirmDelete.count} мэдэгдэл устгах уу?`
                    : "Энэ мэдэгдлийг устгах уу?"}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {confirmDelete.kind === "single"
                    ? confirmDelete.title
                    : "Сонгосон мэдэгдлүүд бүрмөсөн арилна."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="btn-game-outline flex-1 text-sm"
                >
                  Үгүй
                </button>
                <button
                  onClick={() => {
                    const target = confirmDelete;
                    setConfirmDelete(null);
                    if (target.kind === "single") doDeleteOne(target.id);
                    else doDeleteSelected();
                  }}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-destructive text-white flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Устгах
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
