"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { SkeletonProfile, SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem, FadeIn } from "@/components/AnimatedList";
import { useUser, useSubmissions } from "@/lib/swr";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: userLoading, mutate } = useUser();
  const { submissions, isLoading: subLoading } = useSubmissions();
  const [tab, setTab] = useState<"stats" | "album">("stats");
  const [showLogout, setShowLogout] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", username: "" });
  const [saving, setSaving] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Амжилттай гарлаа");
    router.push("/login");
  }

  function openEdit() {
    if (!user) return;
    setEditForm({ displayName: user.displayName, username: user.username });
    setShowEdit(true);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Хадгалж чадсангүй");
        return;
      }
      toast.success("Профайл шинэчлэгдлээ!");
      mutate();
      setShowEdit(false);
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar
        showBack
        title="Profile"
        rightAction={
          <button
            onClick={() => setShowLogout(true)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
          >
            Logout
          </button>
        }
      />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <AnimatedItem>
          {userLoading ? (
            <SkeletonProfile />
          ) : (
            <div className="game-card p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-neon-purple/8 rounded-full blur-3xl -translate-y-1/2" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 ring-2 ring-neon-purple/30 flex items-center justify-center text-2xl font-bold text-neon-purple mb-4">
                  {user?.displayName?.[0]}
                </div>
                <h2 className="font-display text-xl font-bold">{user?.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{user?.username}</p>

                <button
                  onClick={openEdit}
                  className="mt-3 text-xs px-4 py-1.5 rounded-full font-medium bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                >
                  Edit Profile
                </button>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <div className="font-mono text-xl font-bold text-neon-gold text-glow-gold">{user?.xp}</div>
                    <div className="text-[11px] text-muted-foreground">Total XP</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold text-neon-purple">{user?.level}</div>
                    <div className="text-[11px] text-muted-foreground">Level</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold text-neon-orange">{user?.streak}</div>
                    <div className="text-[11px] text-muted-foreground">Streak</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatedItem>

        <AnimatedItem>
          <div className="space-y-2">
            <Link href="/leaderboard" className="game-card p-4 flex items-center justify-between group block">
              <div className="flex items-center gap-3">
                <div className="emoji-ring">🏆</div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-neon-purple transition-colors">Leaderboard</div>
                  <div className="text-xs text-muted-foreground">See rankings</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
            <Link href="/achievements" className="game-card p-4 flex items-center justify-between group block">
              <div className="flex items-center gap-3">
                <div className="emoji-ring">🎖️</div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-neon-purple transition-colors">Achievements</div>
                  <div className="text-xs text-muted-foreground">Badges & rewards</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="flex border-b border-border">
            {(["stats", "album"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-medium tracking-wide transition-all ${
                  tab === t
                    ? "text-neon-purple border-b-2 border-neon-purple"
                    : "text-muted-foreground"
                }`}
              >
                {t === "stats" ? "Stats" : `Album (${subLoading ? "..." : submissions.length})`}
              </button>
            ))}
          </div>
        </AnimatedItem>

        <AnimatedItem>
          {tab === "stats" && (
            subLoading ? <SkeletonList count={2} /> : (
              <div className="space-y-2">
                <div className="game-card p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quests Completed</span>
                  <span className="font-mono font-bold text-neon-purple">{submissions.length}</span>
                </div>
                <div className="game-card p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total XP Earned</span>
                  <span className="font-mono font-bold text-neon-gold">
                    {submissions.reduce((sum: number, s: any) => sum + s.xpAwarded, 0)}
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
                    <img src={sub.photoUrl} alt={sub.caption || ""} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-1.5">
                      <p className="text-[9px] text-white truncate">{sub.quest.title}</p>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-muted-foreground text-sm">
                    No photos yet — complete quests to fill your album!
                  </div>
                )}
              </div>
            )
          )}
        </AnimatedItem>
      </AnimatedList>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="game-card p-6 w-full max-w-sm text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl">👋</div>
              <h3 className="font-display text-lg font-bold">Гарах уу?</h3>
              <p className="text-sm text-muted-foreground">Та системээс гарахдаа итгэлтэй байна уу?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="btn-game-outline flex-1 text-center"
                >
                  Үгүй
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
                >
                  Гарах
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="game-card p-6 w-full max-w-sm space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-center">Edit Profile</h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEdit(false)}
                  className="btn-game-outline flex-1 text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-game flex-1 text-center"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
