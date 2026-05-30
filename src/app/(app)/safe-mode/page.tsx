"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { useUser } from "@/lib/swr";
import { toast } from "sonner";

const DAYS_OPTIONS = [1, 3, 7];
const COIN_PER_DAY = 50;
const DAILY_XP = 10;

export default function SafeModePage() {
  const { user, mutate } = useUser();
  const [days, setDays] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isSafeMode = !!user?.isSafeMode;
  const expires = user?.safeModeExpires ? new Date(user.safeModeExpires) : null;
  const stillActive = isSafeMode && expires && expires > now;

  const cost = days * COIN_PER_DAY;
  const userCoins = user?.coins ?? 0;
  const canAfford = userCoins >= cost;

  async function activate() {
    if (!canAfford) { toast.error("Coin хүрэлцэхгүй байна"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/safe-mode/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Алдаа гарлаа"); return; }
      toast.success(`🏕️ ${days} хоног Safe Mode идэвхжлээ!`);
      mutate();
    } catch {
      toast.error("Сүлжээний алдаа");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = stillActive ? formatRemaining(expires!.getTime() - now.getTime()) : null;

  return (
    <>
      <TopBar showBack title="Camping Pass" />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* ── Status banner ── */}
        {stillActive ? (
          <div className="rounded-2xl border border-neon-green/40 bg-neon-green/5 p-5 text-center space-y-2 shadow-[0_0_24px_rgba(52,211,153,0.1)]">
            <div className="text-4xl">🏕️</div>
            <div className="text-xs uppercase tracking-widest text-neon-green font-semibold">
              Offline / Camping
            </div>
            <div className="font-mono text-2xl font-bold text-foreground">{remaining}</div>
            <p className="text-xs text-muted-foreground">
              Streak царцаасан · Өдөр бүр +{DAILY_XP} XP олж байна
            </p>
          </div>
        ) : (
          <div className="game-card p-5 text-center space-y-2">
            <div className="text-4xl">⛰️</div>
            <h2 className="font-bold">Хөдөө явах уу?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Camping Pass идэвхжүүлбэл Streak тань царцана, өдөр бүр автоматаар <span className="text-neon-purple font-bold">+{DAILY_XP} XP</span> олно.
            </p>
          </div>
        )}

        {/* ── Days selector ── */}
        <div className="game-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Хэдэн хоног?
            </label>
            <div className="text-xs text-muted-foreground">
              🪙 {userCoins} Coin
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DAYS_OPTIONS.map((d) => {
              const active = days === d;
              return (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-xl py-3 text-center transition-all border ${
                    active
                      ? "border-neon-purple/60 bg-neon-purple/10 shadow-[0_0_12px_rgba(124,92,255,0.15)]"
                      : "border-border bg-secondary hover:border-neon-purple/30"
                  }`}
                >
                  <div className={`font-mono text-xl font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {d}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">хоног</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Үнэ</span>
            <span className={`font-mono text-base font-bold ${canAfford ? "text-neon-gold" : "text-neon-red"}`}>
              🪙 {cost}
            </span>
          </div>
        </div>

        <button
          onClick={activate}
          disabled={submitting || !canAfford}
          className="btn-game w-full disabled:opacity-40"
        >
          {submitting
            ? "Идэвхжүүлж байна..."
            : stillActive
            ? `+${days} хоног нэмэх`
            : "Camping Pass авах"}
        </button>

        {/* ── Info ── */}
        <div className="game-card p-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>Streak царцана — буцаж ирэхэд хэвээр үлдэнэ</span>
          </div>
          <div className="flex items-start gap-2">
            <span>⚡</span>
            <span>Өдөр бүр +{DAILY_XP} Идэвхгүй XP</span>
          </div>
          <div className="flex items-start gap-2">
            <span>📵</span>
            <span>Бусдад "Offline / Camping" статус харагдана</span>
          </div>
        </div>
      </div>
    </>
  );
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}ө ${hours}ц ${minutes}м`;
  if (hours > 0) return `${hours}ц ${minutes}м ${seconds}с`;
  return `${minutes}м ${seconds}с`;
}
