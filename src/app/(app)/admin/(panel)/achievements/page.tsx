"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AchievementModal from "@/components/admin/AchievementModal";
import type { AdminAchievement, AchievementPayload } from "@/lib/admin/types";

const rarityClass: Record<string, string> = {
  COMMON: "bg-secondary text-muted-foreground",
  RARE: "bg-neon-blue/10 text-neon-blue",
  EPIC: "bg-neon-purple/15 text-neon-purple",
  LEGENDARY: "bg-neon-gold/15 text-neon-gold",
};

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<AdminAchievement[] | null>(null);
  const [editing, setEditing] = useState<AdminAchievement | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/achievements");
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      toast.error(d.error || "Уншиж чадсангүй");
      setItems([]);
      return;
    }
    setItems(d.achievements || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(payload: AchievementPayload) {
    const method = payload.id ? "PUT" : "POST";
    const r = await fetch("/api/admin/achievements", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      toast.error(d.error || "Хадгалахад алдаа");
      return;
    }
    toast.success(payload.id ? "Шинэчлэгдлээ" : "Үүсгэлээ");
    setEditing(null);
    setCreating(false);
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`${name} устгах уу?`)) return;
    const r = await fetch("/api/admin/achievements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) {
      toast.error("Устгахад алдаа");
      return;
    }
    toast.success("Устгалаа");
    load();
  }

  return (
    <>
      {(editing || creating) && (
        <AchievementModal
          achievement={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}

      <div className="space-y-2">
        <button
          onClick={() => setCreating(true)}
          className="w-full game-card p-4 text-center border-2 border-dashed border-border hover:border-neon-purple/40 transition-all group"
        >
          <span className="text-sm font-medium text-muted-foreground group-hover:text-neon-purple transition-colors">
            + Шинэ achievement
          </span>
        </button>

        {!items ? (
          <div className="game-card p-8 text-center text-sm text-muted-foreground animate-pulse">
            Уншиж байна...
          </div>
        ) : items.length === 0 ? (
          <div className="game-card p-8 text-center text-sm text-muted-foreground">
            Achievement байхгүй
          </div>
        ) : (
          items.map((a) => (
            <div key={a.id} className="game-card p-3.5 flex items-center gap-3">
              <div className="text-2xl flex-shrink-0">{a.iconEmoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`pill text-[10px] ${rarityClass[a.rarity] ?? rarityClass.COMMON}`}>
                    {a.rarity}
                  </span>
                  <span className="text-[10px] font-mono text-neon-gold">⚡ {a.xpReward}</span>
                  <span className="text-[10px] font-mono text-neon-pink">🪙 {a.coinReward}</span>
                  <span className="text-[10px] text-muted-foreground">{a._count.unlocks} unlocks</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing(a)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  </svg>
                </button>
                <button
                  onClick={() => remove(a.id, a.name)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
