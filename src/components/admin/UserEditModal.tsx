"use client";

import { useState } from "react";
import type { AdminUser, UserUpdatePayload } from "@/lib/admin/types";
import { fieldInput, fieldLabel } from "@/lib/admin/styles";

export default function UserEditModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (id: string, updates: UserUpdatePayload) => void;
}) {
  const [xp, setXp] = useState(String(user.xp));
  const [coins, setCoins] = useState(String(user.coins ?? 0));
  const [level, setLevel] = useState(String(user.level));
  const [streak, setStreak] = useState(String(user.streak));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="game-card p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base font-bold">{user.displayName} засах</h3>
        <p className="text-xs text-muted-foreground">@{user.username} · {user.email}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={fieldLabel}>XP</label>
            <input
              type="number"
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Coins 🪙</label>
            <input
              type="number"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Level</label>
            <input
              type="number"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Streak</label>
            <input
              type="number"
              value={streak}
              onChange={(e) => setStreak(e.target.value)}
              className={fieldInput}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button
            onClick={() =>
              onSave(user.id, {
                xp: Number(xp),
                coins: Number(coins),
                level: Number(level),
                streak: Number(streak),
              })
            }
            className="btn-game flex-1 text-sm"
          >
            Хадгалах
          </button>
        </div>
      </div>
    </div>
  );
}
