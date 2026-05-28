"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { SkeletonProfile, SkeletonList } from "@/components/Skeleton";
import { useUser, useSubmissions } from "@/lib/swr";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { submissions, isLoading: subLoading } = useSubmissions();
  const [tab, setTab] = useState<"stats" | "album">("stats");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <TopBar
        title="PROFILE"
        rightAction={
          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">
            Logout
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {userLoading ? (
          <SkeletonProfile />
        ) : (
          <div className="card-cyber p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-magenta)]/20 border-2 border-[var(--neon-cyan)] flex items-center justify-center text-2xl font-bold text-[var(--neon-cyan)] mb-3"
              style={{ boxShadow: "0 0 20px rgba(0,240,255,0.3)" }}>
              {user?.displayName?.[0]}
            </div>
            <h2 className="text-xl font-bold">{user?.displayName}</h2>
            <p className="text-sm text-[var(--text-secondary)]">@{user?.username}</p>

            <div className="grid grid-cols-3 gap-4 mt-5">
              <div>
                <div className="text-2xl font-bold text-[var(--neon-green)] neon-glow-green">{user?.xp}</div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Total XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--neon-cyan)] neon-glow">{user?.level}</div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--neon-yellow)]">🔥 {user?.streak}</div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Streak</div>
              </div>
            </div>
          </div>
        )}

        <Link href="/leaderboard" className="card-cyber p-4 flex items-center justify-between hover:scale-[1.01] transition-transform block">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="text-sm font-bold">Leaderboard</div>
              <div className="text-xs text-[var(--text-secondary)]">See rankings</div>
            </div>
          </div>
          <span className="text-[var(--neon-cyan)]">→</span>
        </Link>

        <div className="flex border-b border-[rgba(0,240,255,0.15)]">
          {(["stats", "album"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t
                  ? "text-[var(--neon-cyan)] border-b-2 border-[var(--neon-cyan)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {t === "stats" ? "Stats" : `Album (${subLoading ? "..." : submissions.length})`}
            </button>
          ))}
        </div>

        {tab === "stats" && (
          subLoading ? <SkeletonList count={2} /> : (
            <div className="space-y-3">
              <div className="card-cyber p-4 flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Quests Completed</span>
                <span className="font-bold text-[var(--neon-cyan)]">{submissions.length}</span>
              </div>
              <div className="card-cyber p-4 flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Total XP Earned</span>
                <span className="font-bold text-[var(--neon-green)]">
                  {submissions.reduce((sum: number, s: any) => sum + s.xpAwarded, 0)}
                </span>
              </div>
            </div>
          )
        )}

        {tab === "album" && (
          subLoading ? <SkeletonList count={2} /> : (
            <div className="grid grid-cols-3 gap-1">
              {submissions.map((sub: any) => (
                <div key={sub.id} className="aspect-square relative overflow-hidden rounded-lg border border-[rgba(0,240,255,0.1)]">
                  <img src={sub.photoUrl} alt={sub.caption || ""} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-1">
                    <p className="text-[8px] text-white truncate">{sub.quest.title}</p>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="col-span-3 text-center py-8 text-[var(--text-secondary)] text-sm">
                  No photos yet — complete quests to fill your album!
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}
