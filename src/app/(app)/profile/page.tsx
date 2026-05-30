"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useUser, useSubmissions } from "@/lib/swr";
import AvatarUpload from "@/components/AvatarUpload";
import ProfileCompleteModal from "@/components/ProfileCompleteModal";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, mutate } = useUser();
  const { submissions, isLoading: subLoading } = useSubmissions();
  const [tab, setTab] = useState<"stats" | "album">("stats");
  const [showLogout, setShowLogout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

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
              { href: "/leaderboard", emoji: "🏆", label: "Leaderboard" },
              { href: "/achievements", emoji: "🎖️", label: "Achievements" },
              { href: "/trivia/mine", emoji: "🧠", label: "Миний Trivia" },
              { href: "/safe-mode", emoji: "🏕️", label: "Camping Pass" },

            ].map(({ href, emoji, label }) => (
              <Link key={href} href={href} className="game-card p-3 flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </AnimatedItem>

        {/* ── Tabs ── */}
        <AnimatedItem>
          <div className="flex border-b border-border">
            {(["stats", "album"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-all ${tab === t ? "text-neon-purple border-b-2 border-neon-purple" : "text-muted-foreground"
                  }`}
              >
                {t === "stats" ? "Stats" : `Album (${subLoading ? "…" : submissions.length})`}
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
