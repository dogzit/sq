"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminEffect } from "@/lib/admin/types";

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "дууссан";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}м`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}ц`;
  return `${Math.floor(hrs / 24)}ө`;
}

export default function AdminEffectsPage() {
  const [items, setItems] = useState<AdminEffect[] | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/effects");
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      toast.error(d.error || "Уншиж чадсангүй");
      setItems([]);
      return;
    }
    setItems(d.effects || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(id: string) {
    if (!confirm("Effect-ыг устгах уу?")) return;
    setActing(id);
    try {
      const r = await fetch("/api/admin/effects", {
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
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-2">
      {!items ? (
        <div className="game-card p-8 text-center text-sm text-muted-foreground animate-pulse">
          Уншиж байна...
        </div>
      ) : items.length === 0 ? (
        <div className="game-card p-8 text-center text-sm text-muted-foreground">
          Идэвхтэй effect байхгүй
        </div>
      ) : (
        items.map((e) => {
          const isBuff = e.effectType === "BUFF";
          return (
            <div key={e.id} className="game-card p-3.5 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  isBuff ? "bg-neon-green/15 text-neon-green" : "bg-destructive/15 text-destructive"
                }`}
              >
                {isBuff ? "✨" : "💀"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">
                  {isBuff ? "Ивээх" : "Хараах"}{" "}
                  <span className="text-xs text-muted-foreground font-mono">
                    ×{e.multiplier}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  @{e.caster.username} → @{e.target.username}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Дуусахад: {timeLeft(e.expiresAt)}
                </div>
              </div>
              <button
                disabled={acting === e.id}
                onClick={() => revoke(e.id)}
                className="text-xs py-1.5 px-3 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors disabled:opacity-40"
              >
                Цуцлах
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
