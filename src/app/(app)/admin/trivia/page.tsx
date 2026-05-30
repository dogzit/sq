"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";

interface PendingTrivia {
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
  creator: { username: string; displayName: string; avatarUrl: string | null };
}

type Tab = "PENDING" | "APPROVED" | "REJECTED";

export default function AdminTriviaPage() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [items, setItems] = useState<PendingTrivia[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/trivia?status=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { toast.error(d.error); return; }
        setItems(d.questions || []);
        const c: Record<string, number> = {};
        (d.counts ?? []).forEach((x: any) => { c[x.status] = x._count; });
        setCounts(c);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setActingOn(id);
    try {
      const res = await fetch(`/api/admin/trivia/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Алдаа"); return; }
      toast.success("✅ Батлагдлаа");
      setItems((arr) => arr.filter((x) => x.id !== id));
    } finally {
      setActingOn(null);
    }
  }

  async function reject() {
    if (!rejectingId) return;
    if (!rejectReason.trim()) { toast.error("Шалтгаан оруулна уу"); return; }
    setActingOn(rejectingId);
    try {
      const res = await fetch(`/api/admin/trivia/${rejectingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Алдаа"); return; }
      toast.success("❌ Татгалзлаа");
      setItems((arr) => arr.filter((x) => x.id !== rejectingId));
      setRejectingId(null);
      setRejectReason("");
    } finally {
      setActingOn(null);
    }
  }

  const TAB_META: Record<Tab, { label: string; cls: string; emoji: string }> = {
    PENDING:  { label: "Хүлээгдэж буй", cls: "text-neon-gold border-neon-gold", emoji: "⏳" },
    APPROVED: { label: "Батлагдсан",    cls: "text-neon-green border-neon-green", emoji: "✅" },
    REJECTED: { label: "Татгалзагдсан",  cls: "text-neon-red border-neon-red", emoji: "❌" },
  };

  return (
    <>
      <TopBar showBack title="Trivia модерац" />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                tab === t ? TAB_META[t].cls : "text-muted-foreground border-transparent"
              }`}
            >
              {TAB_META[t].emoji} {TAB_META[t].label}
              {counts[t] != null && counts[t] > 0 && (
                <span className="ml-1 opacity-70">({counts[t]})</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="game-card p-8 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <p className="text-sm text-muted-foreground">Энд хоосон байна</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((q) => (
              <div key={q.id} className="game-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-neon-purple/15 flex items-center justify-center text-[10px] font-bold text-neon-purple">
                    {q.creator.avatarUrl ? (
                      <img src={q.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      q.creator.displayName?.[0]
                    )}
                  </div>
                  <span>@{q.creator.username}</span>
                  <span className="opacity-50">·</span>
                  <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Question */}
                <p className="text-sm font-bold text-foreground leading-snug">
                  {q.question}
                </p>

                {/* Options */}
                <div className="space-y-1.5">
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.correctIndex;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                          isCorrect
                            ? "border-neon-green/50 bg-neon-green/5 text-neon-green"
                            : "border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold w-4">{String.fromCharCode(65 + i)}</span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <span>✓</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="pill bg-neon-gold/10 text-neon-gold">🪙 {q.coinReward}</span>
                  <span className="pill bg-neon-purple/10 text-neon-purple">⚡ {q.xpReward}</span>
                </div>

                {/* Reject reason if rejected */}
                {q.status === "REJECTED" && q.rejectReason && (
                  <div className="text-xs text-neon-red bg-neon-red/5 border border-neon-red/20 rounded-lg px-3 py-2">
                    <span className="font-semibold">Шалтгаан:</span> {q.rejectReason}
                  </div>
                )}

                {/* Action buttons — only for PENDING */}
                {q.status === "PENDING" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => approve(q.id)}
                      disabled={actingOn === q.id}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold bg-neon-green/15 text-neon-green border border-neon-green/40 hover:bg-neon-green/25 transition-all disabled:opacity-40"
                    >
                      ✅ Батлах
                    </button>
                    <button
                      onClick={() => { setRejectingId(q.id); setRejectReason(""); }}
                      disabled={actingOn === q.id}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold bg-neon-red/15 text-neon-red border border-neon-red/40 hover:bg-neon-red/25 transition-all disabled:opacity-40"
                    >
                      ❌ Татгалзах
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold">Татгалзах шалтгаан</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Жишээ нь: Зөв хариулт буруу байна"
              className="w-full rounded-xl bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-neon-red/60 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="btn-game-outline flex-1"
              >
                Болих
              </button>
              <button
                onClick={reject}
                disabled={actingOn === rejectingId}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-neon-red text-white disabled:opacity-40"
              >
                Татгалзах
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
