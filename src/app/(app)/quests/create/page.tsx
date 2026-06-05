"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";

const DIFFICULTIES: { value: Difficulty; label: string; color: string; bg: string; maxXp: number; maxCoins: number }[] = [
  { value: "EASY",      label: "Easy",      color: "text-neon-green",  bg: "bg-neon-green/10",  maxXp: 40,  maxCoins: 15 },
  { value: "MEDIUM",    label: "Medium",    color: "text-blue-400",    bg: "bg-blue-400/10",    maxXp: 80,  maxCoins: 30 },
  { value: "HARD",      label: "Hard",      color: "text-neon-orange", bg: "bg-neon-orange/10", maxXp: 150, maxCoins: 55 },
  { value: "LEGENDARY", label: "Legendary", color: "text-neon-red",    bg: "bg-neon-red/10",    maxXp: 250, maxCoins: 100 },
];

export default function CreateQuestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [xpReward, setXpReward] = useState(50);
  const [coinReward, setCoinReward] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  const cap = DIFFICULTIES.find((d) => d.value === difficulty)!;

  function pickDifficulty(d: Difficulty) {
    setDifficulty(d);
    const c = DIFFICULTIES.find((x) => x.value === d)!;
    setXpReward(Math.min(xpReward, c.maxXp));
    setCoinReward(Math.min(coinReward, c.maxCoins));
  }

  async function submit() {
    if (title.trim().length < 4) { toast.error("Гарчиг хэт богино"); return; }
    if (description.trim().length < 10) { toast.error("Тайлбар хэт богино"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quests/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, difficulty, xpReward, coinReward }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Алдаа гарлаа"); return; }
      toast.success("⏳ Админ батлахыг хүлээж байна");
      router.push("/quests/mine");
    } catch {
      toast.error("Сүлжээний алдаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopBar showBack title="Quest үүсгэх" />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">

        <div className="rounded-xl border border-neon-gold/30 bg-neon-gold/5 p-3 flex items-start gap-2.5">
          <span className="text-base">⏳</span>
          <div className="flex-1 text-xs leading-relaxed">
            <span className="text-neon-gold font-semibold">Админ батлах шаардлагатай.</span>
            <span className="text-muted-foreground"> Батлагдсан quest бусдад харагдах ба та өөрөө шагнал авна.</span>
          </div>
        </div>

        <div className="game-card p-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Гарчиг <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Жишээ нь: Танихгүй хүнтэй мэндчилэх"
            maxLength={80}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-purple/60 transition-all"
          />
          <div className="text-[10px] text-muted-foreground/60 text-right">{title.length}/80</div>
        </div>

        <div className="game-card p-4 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Тайлбар <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quest-ийг хэрхэн биелүүлэх вэ? Ямар нотолгоо илгээх шаардлагатай вэ?"
            rows={4}
            maxLength={500}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-purple/60 transition-all resize-none"
          />
          <div className="text-[10px] text-muted-foreground/60 text-right">{description.length}/500</div>
        </div>

        <div className="game-card p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Хүндрэлийн зэрэг
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => pickDifficulty(d.value)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    active ? `${d.bg} ${d.color} ring-1 ring-current` : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="game-card p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Шагнал
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>⚡</span> XP (5 - {cap.maxXp})
              </div>
              <input
                type="number"
                min={5}
                max={cap.maxXp}
                value={xpReward}
                onChange={(e) => setXpReward(Math.min(Math.max(Number(e.target.value) || 0, 5), cap.maxXp))}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-mono text-neon-purple focus:outline-none focus:border-neon-purple/60 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>🪙</span> Coin (0 - {cap.maxCoins})
              </div>
              <input
                type="number"
                min={0}
                max={cap.maxCoins}
                value={coinReward}
                onChange={(e) => setCoinReward(Math.min(Math.max(Number(e.target.value) || 0, 0), cap.maxCoins))}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-mono text-neon-gold focus:outline-none focus:border-neon-gold/60 transition-all"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            Батлагдсан үед та өөрөө {xpReward} XP, {coinReward} 🪙 шагнал авна.
          </p>
        </div>

        <button onClick={submit} disabled={submitting} className="btn-game w-full disabled:opacity-40">
          {submitting ? "Илгээж байна..." : "Quest илгээх"}
        </button>
      </div>
    </>
  );
}
