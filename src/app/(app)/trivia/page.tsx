"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useUser } from "@/lib/swr";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  options: string[];
  coinReward: number;
  xpReward: number;
  creator: { displayName: string; username: string; avatarUrl: string | null };
}

interface Result {
  isCorrect: boolean;
  correctIndex: number;
  coinsEarned: number;
  xpEarned: number;
}

export default function TriviaPage() {
  const { mutate: mutateUser } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/trivia")
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .finally(() => setLoading(false));
  }, []);

  const current = questions[idx];

  async function check() {
    if (selected === null || !current) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trivia/${current.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIndex: selected }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Алдаа гарлаа"); return; }
      setResult(data);
      if (data.isCorrect) {
        toast.success(`+${data.coinsEarned} 🪙 · +${data.xpEarned} ⚡`);
        mutateUser();
      } else {
        toast.error("Буруу хариулт");
      }
    } catch {
      toast.error("Сүлжээний алдаа");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setSelected(null);
    setResult(null);
    setIdx((i) => i + 1);
  }

  return (
    <>
      <TopBar
        showBack
        title="Trivia"
        rightAction={
          <Link
            href="/trivia/create"
            className="text-xs px-3 py-1.5 rounded-full font-semibold bg-neon-purple/15 text-neon-purple hover:bg-neon-purple/25 transition-all"
          >
            + Үүсгэх
          </Link>
        }
      />

      <div className="max-w-md mx-auto px-4 py-4">
        {loading ? (
          <div className="h-64 rounded-2xl bg-secondary animate-pulse" />
        ) : questions.length === 0 ? (
          <EmptyState />
        ) : idx >= questions.length ? (
          <DoneState onReset={() => { setIdx(0); setLoading(true); fetch("/api/trivia").then(r => r.json()).then(d => setQuestions(d.questions || [])).finally(() => setLoading(false)); }} />
        ) : current && (
          <div className="space-y-4 animate-fade-in">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {idx + 1} / {questions.length}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="pill bg-neon-gold/10 text-neon-gold">🪙 {current.coinReward}</span>
                <span className="pill bg-neon-purple/10 text-neon-purple">⚡ {current.xpReward}</span>
              </div>
            </div>

            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-purple transition-all duration-500"
                style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <div className="game-card p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-neon-purple/15 flex items-center justify-center text-[10px] font-bold text-neon-purple">
                  {current.creator.avatarUrl ? (
                    <img src={current.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    current.creator.displayName?.[0]
                  )}
                </div>
                <span>@{current.creator.username}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                {current.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {current.options.map((opt, i) => {
                const isSelected = selected === i;
                const showResult = result !== null;
                const isCorrect = showResult && i === result.correctIndex;
                const isWrong = showResult && isSelected && !result.isCorrect;

                return (
                  <button
                    key={i}
                    onClick={() => !result && setSelected(i)}
                    disabled={!!result}
                    className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center gap-3 ${
                      isCorrect
                        ? "border-neon-green/60 bg-neon-green/10 text-neon-green"
                        : isWrong
                        ? "border-neon-red/60 bg-neon-red/10 text-neon-red"
                        : isSelected
                        ? "border-neon-purple/60 bg-neon-purple/10 text-foreground"
                        : "border-border bg-secondary text-foreground hover:border-neon-purple/30 active:scale-[0.98]"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      isSelected || isCorrect ? "border-current" : "border-border bg-background text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <span>✓</span>}
                    {isWrong && <span>✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Action */}
            {result === null ? (
              <button
                onClick={check}
                disabled={selected === null || submitting}
                className="btn-game w-full disabled:opacity-40"
              >
                {submitting ? "Шалгаж байна..." : "Шалгах"}
              </button>
            ) : (
              <button onClick={next} className="btn-game w-full">
                {idx + 1 >= questions.length ? "Дуусгах" : "Дараагийн асуулт →"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="game-card p-8 text-center space-y-3">
      <div className="text-5xl">🤷</div>
      <h3 className="font-bold text-foreground">Шинэ асуулт алга</h3>
      <p className="text-sm text-muted-foreground">
        Та бүх асуултанд хариулсан байна эсвэл асуулт үүсгэгдээгүй байна
      </p>
      <Link href="/trivia/create" className="btn-game inline-block mt-2">
        Асуулт үүсгэх
      </Link>
    </div>
  );
}

function DoneState({ onReset }: { onReset: () => void }) {
  return (
    <div className="game-card p-8 text-center space-y-3">
      <div className="text-5xl">🎉</div>
      <h3 className="font-bold text-foreground">Бүгдийг хариуллаа!</h3>
      <p className="text-sm text-muted-foreground">Дараа дахин шинэ асуулт ирэх болно</p>
      <button onClick={onReset} className="btn-game-outline">Дахин шалгах</button>
    </div>
  );
}
