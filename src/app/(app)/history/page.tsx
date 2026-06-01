"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { formatTimeAgo } from "@/lib/utils";

interface Submission {
  id: string;
  mediaUrl: string;
  extraMediaUrls: string[];
  mediaType: "IMAGE" | "VIDEO";
  caption: string | null;
  vetoStatus: "PENDING" | "APPROVED" | "REJECTED";
  xpAwarded: number;
  coinsAwarded: number;
  approveCount: number;
  rejectCount: number;
  createdAt: string;
  quest: { id: string; title: string; difficulty: string; xpReward: number } | null;
}

const statusConfig = {
  APPROVED: { label: "Approved", color: "text-neon-green", bg: "bg-neon-green/10" },
  REJECTED: { label: "Rejected", color: "text-destructive", bg: "bg-destructive/10" },
  PENDING: { label: "Pending", color: "text-neon-gold", bg: "bg-neon-gold/10" },
};

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "ALL" ? submissions : submissions.filter((s) => s.vetoStatus === filter);

  const totalXp = submissions
    .filter((s) => s.vetoStatus === "APPROVED")
    .reduce((sum, s) => sum + s.xpAwarded, 0);

  const approved = submissions.filter((s) => s.vetoStatus === "APPROVED").length;

  return (
    <>
      <TopBar title="Түүх" showBack />

      <AnimatedList className="px-4 py-4 space-y-3 max-w-2xl mx-auto pb-24">
        <AnimatedItem>
          <div className="game-card p-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-mono text-lg font-bold">{submissions.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Нийт</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-neon-green">{approved}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Approved</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-neon-gold">{totalXp}</div>
              <div className="text-[10px] text-muted-foreground uppercase">XP earned</div>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  filter === f
                    ? "bg-neon-purple text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "ALL" ? "Бүгд" : statusConfig[f].label}
              </button>
            ))}
          </div>
        </AnimatedItem>

        {loading ? (
          <AnimatedItem>
            <div className="game-card p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading...
            </div>
          </AnimatedItem>
        ) : filtered.length === 0 ? (
          <AnimatedItem>
            <div className="game-card p-10 text-center">
              <div className="text-3xl mb-2">📜</div>
              <div className="text-sm text-muted-foreground">
                {filter === "ALL"
                  ? "Та одоохондоо submission илгээгээгүй байна"
                  : "Энэ статустай submission алга"}
              </div>
            </div>
          </AnimatedItem>
        ) : (
          filtered.map((s) => {
            const status = statusConfig[s.vetoStatus];
            const allUrls = [s.mediaUrl, ...(s.extraMediaUrls ?? [])];
            return (
              <AnimatedItem key={s.id}>
                <Link
                  href={s.quest ? `/quests/${s.quest.id}` : "#"}
                  className="game-card p-3 block hover:ring-1 hover:ring-neon-purple/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                      {s.mediaType === "VIDEO" ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <video src={s.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                          <span className="absolute top-1 right-1 text-[10px]">🎥</span>
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      {allUrls.length > 1 && (
                        <span className="absolute bottom-1 right-1 pill bg-black/70 text-white text-[9px]">
                          +{allUrls.length - 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`pill ${status.bg} ${status.color} text-[10px]`}>
                          {status.label}
                        </span>
                        {s.vetoStatus === "APPROVED" && (
                          <span className="pill bg-neon-gold/10 text-neon-gold font-mono text-[10px]">
                            +{s.xpAwarded} XP
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold truncate">
                        {s.quest?.title ?? "(Quest deleted)"}
                      </h3>
                      {s.caption && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{s.caption}</p>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatTimeAgo(new Date(s.createdAt))}
                        {s.vetoStatus === "PENDING" && (
                          <>
                            <span className="mx-1">·</span>
                            <span className="text-neon-green">{s.approveCount}</span>
                            <span className="mx-0.5">/</span>
                            <span className="text-destructive">{s.rejectCount}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedItem>
            );
          })
        )}
      </AnimatedList>
    </>
  );
}
