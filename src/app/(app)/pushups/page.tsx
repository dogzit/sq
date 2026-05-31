"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import useSWR from "swr";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";
import { useUser } from "@/lib/swr";

const PushUpCounter = dynamic(() => import("@/components/PushUpCounter"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[3/4] sm:aspect-[4/3] w-full max-w-xl mx-auto rounded-2xl bg-secondary animate-pulse" />
  ),
});

interface PushupStatus {
  unlocked: boolean;
  daysLeft: number;
  nextUnlockAt: string | null;
  lastPushupAt: string | null;
  cooldownDays: number;
  coinsPerRep: number;
  pushupTotalReps: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PRESETS = [
  { n: 5, label: "Дасгал", emoji: "🌱" },
  { n: 10, label: "Хөнгөн", emoji: "💪" },
  { n: 20, label: "Дунд", emoji: "🔥" },
  { n: 30, label: "Хүчтэй", emoji: "⚡" },
];

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PushUpsPage() {
  const { mutate: mutateUser } = useUser();
  const { data: status, mutate: mutateStatus } = useSWR<PushupStatus>(
    "/api/pushups/status",
    fetcher,
  );
  const [target, setTarget] = useState(10);
  const [sessionId, setSessionId] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);

  function startSession(n: number) {
    setTarget(n);
    setCurrentCount(0);
    setSessionId((s) => s + 1);
  }

  const isLoading = !status;
  const locked = !!status && !status.unlocked;

  return (
    <>
      <TopBar title="AI Push-up Counter" showBack />

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Hero stats */}
        <div className="game-card p-4 flex items-center justify-between bg-gradient-to-br from-neon-purple/10 to-cyan-500/10 border-neon-purple/30">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Хийсэн нийт
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {status?.pushupTotalReps ?? 0}{" "}
              <span className="text-xs text-muted-foreground font-mono">суниалт</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Шагнал/суниалт
            </div>
            <div className="font-display text-2xl font-bold text-neon-gold">
              ×{status?.coinsPerRep ?? 2} 🪙
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="game-card p-8 text-center text-sm text-muted-foreground">
            Ачаалж байна...
          </div>
        ) : locked ? (
          <div className="game-card p-6 text-center bg-gradient-to-br from-rose-500/10 to-neon-purple/10 border-neon-purple/30 space-y-3">
            <div className="text-5xl">🔒</div>
            <div>
              <div className="font-display text-lg font-bold text-foreground">
                Цоожлогдсон
              </div>
              <div className="text-xs text-muted-foreground">
                Дараагийн суниалт{" "}
                <span className="font-mono font-bold text-neon-purple">
                  {status!.daysLeft} хоног
                </span>
                -ийн дараа нээгдэнэ
              </div>
            </div>
            <div className="inline-block px-3 py-1.5 rounded-full bg-secondary text-[11px] font-mono text-muted-foreground">
              {fmt(status!.nextUnlockAt)} -д нээгдэнэ
            </div>
            <div className="text-[11px] text-muted-foreground pt-1">
              Сүүлчийн удаа: {fmt(status!.lastPushupAt)}
            </div>
          </div>
        ) : (
          <>
            {/* Target presets */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Зорилго сонгох · бүрд {status!.coinsPerRep}🪙
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const active = target === p.n;
                  return (
                    <button
                      key={p.n}
                      onClick={() => startSession(p.n)}
                      className={`game-card p-2.5 flex flex-col items-center transition-all ${
                        active
                          ? "ring-2 ring-neon-purple shadow-[0_0_16px_rgba(124,92,255,0.4)]"
                          : "hover:border-neon-purple/40"
                      }`}
                    >
                      <div className="text-xl mb-0.5">{p.emoji}</div>
                      <div className="font-mono font-bold text-base">{p.n}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.label}
                      </div>
                      <div className="text-[10px] text-neon-gold font-mono mt-0.5">
                        {p.n * status!.coinsPerRep}🪙
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera + Counter */}
            <PushUpCounter
              key={sessionId}
              target={target}
              onCount={(n) => setCurrentCount(n)}
              onSuccess={({ reps, coinsAwarded }) => {
                toast.success(
                  `🏆 ${reps} суниалт · +${coinsAwarded} 🪙 шагнал!`,
                );
                mutateStatus();
                mutateUser();
              }}
            />

            {/* Tips */}
            <div className="game-card p-4 space-y-2">
              <div className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
                💡 Зөвлөмж
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Утсаа хажуу талд босоо тавьж бүтэн биеэ харуулна уу</li>
                <li>Тохой–мөр–бугуй гурав ил харагдах өнцөгт байрлуулна уу</li>
                <li>Зорилгод хүрэхэд автоматаар шагнал олгогдоно</li>
                <li>Шагнал авсны дараа дараагийн суниалт {status!.cooldownDays} хоногийн дараа</li>
              </ul>
            </div>
          </>
        )}

        <div className="text-center text-[11px] text-muted-foreground">
          {currentCount > 0 && !locked && (
            <span>
              Идэвхтэй: {currentCount}/{target} ·{" "}
              {currentCount * (status?.coinsPerRep ?? 2)} 🪙 шагнал хүлээгдэж байна
            </span>
          )}
        </div>
      </div>
    </>
  );
}
