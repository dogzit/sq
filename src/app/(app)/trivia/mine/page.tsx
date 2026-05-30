"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";

interface MyTrivia {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  coinReward: number;
  xpReward: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  _count: { answers: number };
}

const STATUS_META: Record<MyTrivia["status"], { label: string; cls: string; emoji: string }> = {
  PENDING:  { label: "Хүлээгдэж буй", cls: "bg-neon-gold/15 text-neon-gold border-neon-gold/40", emoji: "⏳" },
  APPROVED: { label: "Батлагдсан",    cls: "bg-neon-green/15 text-neon-green border-neon-green/40", emoji: "✅" },
  REJECTED: { label: "Татгалзагдсан",  cls: "bg-neon-red/15 text-neon-red border-neon-red/40", emoji: "❌" },
};

export default function MyTriviaPage() {
  const [items, setItems] = useState<MyTrivia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trivia/mine")
      .then((r) => r.json())
      .then((d) => setItems(d.questions || []))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    PENDING: items.filter((i) => i.status === "PENDING").length,
    APPROVED: items.filter((i) => i.status === "APPROVED").length,
    REJECTED: items.filter((i) => i.status === "REJECTED").length,
  };

  return (
    <>
      <TopBar
        showBack
        title="Миний Trivia"
        rightAction={
          <Link
            href="/trivia/create"
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-neon-purple/15 text-neon-purple"
          >
            + Шинэ
          </Link>
        }
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* Status overview */}
        <div className="grid grid-cols-3 gap-2">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
            const m = STATUS_META[s];
            return (
              <div key={s} className={`rounded-xl border ${m.cls} p-3 text-center`}>
                <div className="text-lg">{m.emoji}</div>
                <div className="font-mono text-xl font-bold">{counts[s]}</div>
                <div className="text-[10px] opacity-80">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="game-card p-8 text-center space-y-3">
            <div className="text-5xl">📝</div>
            <h3 className="font-bold">Үүсгэсэн Trivia алга</h3>
            <Link href="/trivia/create" className="btn-game inline-block">
              Эхний асуулт үүсгэх
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((q) => {
              const meta = STATUS_META[q.status];
              return (
                <div key={q.id} className="game-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-snug flex-1">
                      {q.question}
                    </p>
                    <span className={`pill text-[10px] border ${meta.cls}`}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="pill bg-neon-gold/10 text-neon-gold">🪙 {q.coinReward}</span>
                    <span className="pill bg-neon-purple/10 text-neon-purple">⚡ {q.xpReward}</span>
                    {q.status === "APPROVED" && (
                      <span>· {q._count.answers} хариулт</span>
                    )}
                  </div>

                  {q.status === "REJECTED" && q.rejectReason && (
                    <div className="text-xs text-neon-red/90 bg-neon-red/5 border border-neon-red/20 rounded-lg px-3 py-2 mt-1">
                      <span className="font-semibold">Шалтгаан:</span> {q.rejectReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
