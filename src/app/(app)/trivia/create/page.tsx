"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";

export default function CreateTriviaPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [coinReward, setCoinReward] = useState(10);
  const [xpReward, setXpReward] = useState(20);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  async function submit() {
    if (question.trim().length < 5) { toast.error("Асуултаа бичнэ үү"); return; }
    if (options.some((o) => !o.trim())) { toast.error("4 сонголтыг бөглөнө үү"); return; }
    if (correctIndex === null) { toast.error("Зөв хариултаа сонгоно уу"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options, correctIndex, coinReward, xpReward }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Алдаа гарлаа"); return; }
      toast.success("⏳ Админ батлахыг хүлээж байна");
      router.push("/trivia/mine");
    } catch {
      toast.error("Сүлжээний алдаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopBar showBack title="Trivia үүсгэх" />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* Approval notice */}
        <div className="rounded-xl border border-neon-gold/30 bg-neon-gold/5 p-3 flex items-start gap-2.5">
          <span className="text-base">⏳</span>
          <div className="flex-1 text-xs leading-relaxed">
            <span className="text-neon-gold font-semibold">Админ батлах шаардлагатай.</span>
            <span className="text-muted-foreground"> Илгээсний дараа батлагдсаны дараа бусдад харагдана.</span>
          </div>
        </div>

        {/* Question */}
        <div className="game-card p-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Асуулт <span className="text-red-400">*</span>
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Жишээ нь: Монгол улсын нийслэл хот юу вэ?"
            rows={3}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-purple/60 transition-all resize-none"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="px-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Сонголтууд <span className="text-red-400">*</span>
            </label>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Зөв хариултын зүүн талын товчийг сонгоно уу
            </p>
          </div>

          {options.map((opt, i) => {
            const isCorrect = correctIndex === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${
                  isCorrect ? "border-neon-green/60 bg-neon-green/5" : "border-border bg-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCorrectIndex(i)}
                  className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                    isCorrect
                      ? "bg-neon-green text-white shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                      : "bg-secondary text-muted-foreground hover:bg-neon-purple/15 hover:text-neon-purple"
                  }`}
                  aria-label={`${String.fromCharCode(65 + i)}-г зөв хариулт болгох`}
                >
                  {isCorrect ? "✓" : String.fromCharCode(65 + i)}
                </button>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Сонголт ${String.fromCharCode(65 + i)}`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* Rewards */}
        <div className="game-card p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Шагнал
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>🪙</span> Coin (1-100)
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={coinReward}
                onChange={(e) => setCoinReward(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-mono text-neon-gold focus:outline-none focus:border-neon-gold/60 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>⚡</span> XP (1-200)
              </div>
              <input
                type="number"
                min={1}
                max={200}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-mono text-neon-purple focus:outline-none focus:border-neon-purple/60 transition-all"
              />
            </div>
          </div>
        </div>

        <button onClick={submit} disabled={submitting} className="btn-game w-full disabled:opacity-40">
          {submitting ? "Үүсгэж байна..." : "Trivia үүсгэх"}
        </button>
      </div>
    </>
  );
}
