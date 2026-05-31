"use client";

import { useState } from "react";
import type { AdminAchievement, AchievementPayload } from "@/lib/admin/types";
import type { ItemRarity } from "@/generated/prisma/client";
import { fieldInput, fieldInputSm, fieldLabel } from "@/lib/admin/styles";

export default function AchievementModal({
  achievement,
  onClose,
  onSave,
}: {
  achievement: AdminAchievement | null;
  onClose: () => void;
  onSave: (payload: AchievementPayload) => void;
}) {
  const [key, setKey] = useState(achievement?.key || "");
  const [name, setName] = useState(achievement?.name || "");
  const [description, setDescription] = useState(achievement?.description || "");
  const [iconEmoji, setIconEmoji] = useState(achievement?.iconEmoji || "🏆");
  const [xpReward, setXpReward] = useState(String(achievement?.xpReward ?? 50));
  const [coinReward, setCoinReward] = useState(String(achievement?.coinReward ?? 10));
  const [rarity, setRarity] = useState<ItemRarity>(achievement?.rarity || "COMMON");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="game-card p-6 w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base font-bold">
          {achievement ? "Achievement засах" : "Шинэ achievement"}
        </h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={fieldLabel}>Emoji</label>
            <input
              type="text"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Key (өөрчлөгдөхгүй ID)</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!!achievement}
              placeholder="first_quest"
              className={`${fieldInput} disabled:opacity-50`}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First Quest"
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Анхны quest-ээ дуусга"
              className={fieldInput}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={fieldLabel}>⚡ XP</label>
              <input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
                className={fieldInputSm}
              />
            </div>
            <div className="space-y-1">
              <label className={fieldLabel}>🪙 Coin</label>
              <input
                type="number"
                value={coinReward}
                onChange={(e) => setCoinReward(e.target.value)}
                className={fieldInputSm}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Rarity</label>
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as ItemRarity)}
              className={fieldInput}
            >
              <option value="COMMON">COMMON</option>
              <option value="RARE">RARE</option>
              <option value="EPIC">EPIC</option>
              <option value="LEGENDARY">LEGENDARY</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button
            onClick={() =>
              onSave({
                ...(achievement?.id ? { id: achievement.id } : {}),
                key,
                name,
                description,
                iconEmoji,
                xpReward: Number(xpReward),
                coinReward: Number(coinReward),
                rarity,
              })
            }
            disabled={!key || !name || !description}
            className="btn-game flex-1 text-sm"
          >
            {achievement ? "Хадгалах" : "Үүсгэх"}
          </button>
        </div>
      </div>
    </div>
  );
}
