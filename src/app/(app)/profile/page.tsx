"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useUser, useSubmissions, useFriendships, useSuggestedUsers } from "@/lib/swr";
import AvatarUpload from "@/components/AvatarUpload";
import ProfileCompleteModal from "@/components/ProfileCompleteModal";
import UserAvatar from "@/components/UserAvatar";
import FriendButton, { type FriendshipState } from "@/components/FriendButton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface FriendshipRow {
  id: string;
  status: string;
  requester: { id: string; username: string; displayName: string; avatarUrl: string | null; level: number };
  addressee: { id: string; username: string; displayName: string; avatarUrl: string | null; level: number };
}

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  friendship: FriendshipState;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, mutate } = useUser();
  const { submissions, isLoading: subLoading } = useSubmissions();
  const { friendships: accepted, mutate: mutateAccepted } = useFriendships("ACCEPTED");
  const { friendships: pending, mutate: mutatePending } = useFriendships("PENDING");
  const { users: suggested, mutate: mutateSuggested } = useSuggestedUsers();
  const [tab, setTab] = useState<"stats" | "album" | "friends">("stats");
  const [showLogout, setShowLogout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const incomingRequests = (pending as FriendshipRow[]).filter(
    (f) => f.addressee.id === user?.id
  );

  const friends = (accepted as FriendshipRow[]).map((f) =>
    f.requester.id === user?.id ? f.addressee : f.requester
  );

  function refreshFriendData() {
    mutateAccepted();
    mutatePending();
    mutateSuggested();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <TopBar
        showBack
        title="Профайл"
        rightAction={
          <button
            onClick={() => setShowLogout(true)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-destructive/10 text-destructive"
          >
            Гарах
          </button>
        }
      />

      <AnimatedList className="max-w-sm mx-auto px-4 py-4 space-y-3">

        {/* ── Unclaimed achievements reminder ── */}
        {(user?.unclaimedAchievements ?? 0) > 0 && (
          <AnimatedItem>
            <Link
              href="/achievements"
              className="block game-card p-3.5 ring-1 ring-neon-gold/40 bg-gradient-to-r from-neon-gold/10 via-neon-orange/10 to-transparent relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-wiggle">🎖️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">
                    {user!.unclaimedAchievements} шинэ achievement!
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    XP+ Coin шагналаа аваарай — товшоод нээ
                  </div>
                </div>
                <span className="pill bg-neon-gold/25 text-neon-gold font-mono animate-sparkle-pop">
                  Аваx →
                </span>
              </div>
            </Link>
          </AnimatedItem>
        )}

        {/* ── 3:4 Profile Card ── */}
        <AnimatedItem>
          {isLoading ? (
            <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
          ) : (
            <div className="aspect-[3/4] relative rounded-2xl overflow-hidden border border-border">
              {/* Blurred avatar background */}
              <div className="absolute inset-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-40" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon-purple/20 to-neon-blue/10" />
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={() => setShowEdit(true)}
                className="absolute top-3 right-3 z-10 text-xs px-3 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all"
              >
                ✏️ Засах
              </button>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4">
                {/* Gradient fade */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

                <div className="relative z-10 flex flex-col items-center text-center gap-2 w-full">
                  <AvatarUpload
                    avatarUrl={user?.avatarUrl}
                    displayName={user?.displayName}
                    size={80}
                    frameValue={user?.equippedFrameValue}
                    onUpload={(url) =>
                      mutate(
                        (curr: any) => ({ ...curr, user: { ...curr?.user, avatarUrl: url } }),
                        { revalidate: true }
                      )
                    }
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">{user?.displayName}</h2>
                    <p className="text-sm text-white/60">@{user?.username}</p>
                    {user?.bio && (
                      <p className="mt-1.5 text-sm text-white/80 max-w-[220px] mx-auto leading-snug">{user.bio}</p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 mt-1">
                    {[
                      { val: user?.xp, label: "XP", color: "text-neon-gold" },
                      { val: user?.level, label: "Level", color: "text-neon-purple" },
                      { val: user?.streak, label: "Streak", color: "text-neon-orange" },
                    ].map(({ val, label, color }) => (
                      <div key={label} className="text-center">
                        <div className={`font-mono text-lg font-bold ${color}`}>{val}</div>
                        <div className="text-[10px] text-white/50">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatedItem>

        {/* ── Quick links ── */}
        <AnimatedItem>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/feed", emoji: "📰", label: "Найзууд" },
              { href: "/games", emoji: "🎮", label: "Games" },
              { href: "/leaderboard", emoji: "🏆", label: "Leaderboard" },
              { href: "/achievements", emoji: "🎖️", label: "Achievements" },
              { href: "/history", emoji: "📜", label: "Quest түүх" },
              { href: "/trivia/mine", emoji: "🧠", label: "Миний Trivia" },
              { href: "/safe-mode", emoji: "🏕️", label: "Camping Pass" },
              { href: "/help", emoji: "❓", label: "Тусламж" },
            ].map(({ href, emoji, label }) => {
              const isAchievements = href === "/achievements";
              const badgeCount = isAchievements ? (user?.unclaimedAchievements ?? 0) : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`game-card p-3 flex items-center gap-2 relative ${badgeCount > 0 ? "ring-1 ring-neon-gold/40 bg-neon-gold/5" : ""}`}
                >
                  <span className={`text-lg ${badgeCount > 0 ? "animate-wiggle" : ""}`}>{emoji}</span>
                  <span className="text-sm font-medium">{label}</span>
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-neon-red text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </AnimatedItem>

        {/* ── Tabs ── */}
        <AnimatedItem>
          <div className="flex border-b border-border">
            {(["stats", "album", "friends"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-all relative ${tab === t ? "text-neon-purple border-b-2 border-neon-purple" : "text-muted-foreground"
                  }`}
              >
                {t === "stats" && "Stats"}
                {t === "album" && `Album (${subLoading ? "…" : submissions.length})`}
                {t === "friends" && (
                  <>
                    Найз ({friends.length})
                    {incomingRequests.length > 0 && (
                      <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-neon-orange" />
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </AnimatedItem>

        <AnimatedItem>
          {tab === "stats" && (
            subLoading ? <SkeletonList count={2} /> : (
              <div className="space-y-2">
                <div className="game-card p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quests Completed</span>
                  <span className="font-mono font-bold text-neon-purple">{submissions.length}</span>
                </div>
                <div className="game-card p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total XP Earned</span>
                  <span className="font-mono font-bold text-neon-gold">
                    {submissions.reduce((s: number, sub: any) => s + sub.xpAwarded, 0)}
                  </span>
                </div>
              </div>
            )
          )}

          {tab === "album" && (
            subLoading ? <SkeletonList count={2} /> : (
              <div className="grid grid-cols-3 gap-1.5">
                {submissions.map((sub: any) => (
                  <div key={sub.id} className="aspect-square relative overflow-hidden rounded-xl border border-border">
                    {sub.mediaType === "VIDEO" ? (
                      <video src={sub.mediaUrl} muted playsInline className="w-full h-full object-cover bg-black" />
                    ) : (
                      <img src={sub.mediaUrl} alt={sub.caption || ""} className="w-full h-full object-cover" />
                    )}
                    {sub.mediaType === "VIDEO" && (
                      <span className="absolute top-1 right-1 text-[9px] px-1 py-0.5 rounded bg-black/60 text-white">🎥</span>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-1">
                      <p className="text-[9px] text-white truncate">{sub.quest?.title}</p>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">
                    Одоохондоо хоосон байна
                  </div>
                )}
              </div>
            )
          )}

          {tab === "friends" && (
            <div className="space-y-4">
              {/* Incoming requests */}
              {incomingRequests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                    Шинэ хүсэлт ({incomingRequests.length})
                  </div>
                  {incomingRequests.map((f) => (
                    <div key={f.id} className="game-card p-2.5 flex items-center gap-2.5">
                      <Link
                        href={`/users/${f.requester.username}`}
                        className="flex items-center gap-2.5 flex-1 min-w-0"
                      >
                        <UserAvatar user={f.requester} size={36} linkToProfile={false} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{f.requester.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            @{f.requester.username}
                          </div>
                        </div>
                      </Link>
                      <FriendButton
                        userId={f.requester.id}
                        friendship={{ id: f.id, status: "PENDING", direction: "incoming" }}
                        onChange={refreshFriendData}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Friends list */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                  Найзууд ({friends.length})
                </div>
                {friends.length === 0 ? (
                  <div className="game-card p-6 text-center text-sm text-muted-foreground">
                    Найз хараахан алга
                  </div>
                ) : (
                  friends.map((u) => (
                    <Link
                      key={u.id}
                      href={`/users/${u.username}`}
                      className="game-card p-2.5 flex items-center gap-2.5 hover:border-neon-purple/40 transition"
                    >
                      <UserAvatar user={u} size={36} linkToProfile={false} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{u.displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                      </div>
                      <span className="pill bg-neon-purple/10 text-neon-purple text-[10px]">
                        Lvl {u.level}
                      </span>
                    </Link>
                  ))
                )}
              </div>

              {/* Suggestions */}
              {suggested.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Санал болгох
                    </div>
                    <Link href="/users" className="text-[10px] text-neon-purple hover:underline">
                      Бүгд →
                    </Link>
                  </div>
                  {(suggested as SuggestedUser[]).map((u) => (
                    <div key={u.id} className="game-card p-2.5 flex items-center gap-2.5">
                      <Link
                        href={`/users/${u.username}`}
                        className="flex items-center gap-2.5 flex-1 min-w-0"
                      >
                        <UserAvatar user={u} size={36} linkToProfile={false} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{u.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            @{u.username} · Lvl {u.level}
                          </div>
                        </div>
                      </Link>
                      <FriendButton
                        userId={u.id}
                        friendship={u.friendship}
                        onChange={refreshFriendData}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </AnimatedItem>
      </AnimatedList>

      {/* Logout modal */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="game-card p-5 w-full max-w-xs text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-3xl">👋</div>
              <h3 className="font-bold">Гарах уу?</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowLogout(false)} className="btn-game-outline flex-1">Үгүй</button>
                <button onClick={logout} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-destructive text-white">Гарах</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit profile modal — reuses ProfileCompleteModal in edit mode */}
      <ProfileCompleteModal mode="edit" open={showEdit} onClose={() => setShowEdit(false)} />
    </>
  );
}