"use client";

import { useState } from "react";
import type { AdminLobby, QuestCreatePayload } from "@/lib/admin/types";
import type {
  CharacterClass,
  QuestDifficulty,
  QuestType,
} from "@/generated/prisma/client";
import { fieldInput, fieldInputSm, fieldLabel } from "@/lib/admin/styles";

export default function QuestCreateModal({
  lobbies,
  onClose,
  onSave,
}: {
  lobbies: AdminLobby[];
  onClose: () => void;
  onSave: (quest: QuestCreatePayload) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState("50");
  const [coinReward, setCoinReward] = useState("10");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("MEDIUM");
  const [questType, setQuestType] = useState<QuestType>("DAILY");
  const [lobbyId, setLobbyId] = useState(lobbies[0]?.id ?? "");
  const [bonusClass, setBonusClass] = useState<CharacterClass | "NONE">("NONE");
  const [expiresInHours, setExpiresInHours] = useState("24");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="game-card p-6 w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base font-bold">Шинэ Quest</h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={fieldLabel}>Гарчиг</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quest title"
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Тайлбар</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quest description"
              rows={3}
              className={`${fieldInput} resize-none`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
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
            <div className="space-y-1">
              <label className={fieldLabel}>⏱ Цаг</label>
              <input
                type="number"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                className={fieldInputSm}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={fieldLabel}>Хүндрэл</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestDifficulty)}
                className={fieldInput}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="LEGENDARY">Legendary</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={fieldLabel}>Төрөл</label>
              <select
                value={questType}
                onChange={(e) => setQuestType(e.target.value as QuestType)}
                className={fieldInput}
              >
                <option value="DAILY">Daily</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Bonus class (+25% XP тухайн класст)</label>
            <select
              value={bonusClass}
              onChange={(e) => setBonusClass(e.target.value as CharacterClass | "NONE")}
              className={fieldInput}
            >
              <option value="NONE">Bonus байхгүй</option>
              <option value="TANK">TANK</option>
              <option value="MAGE">MAGE</option>
              <option value="CLOWN">CLOWN</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Lobby</label>
            <select
              value={lobbyId}
              onChange={(e) => setLobbyId(e.target.value)}
              className={fieldInput}
            >
              {lobbies.length === 0 && <option value="">— Lobby алга —</option>}
              {lobbies.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button
            onClick={() =>
              onSave({
                title,
                description,
                xpReward: Number(xpReward),
                coinReward: Number(coinReward),
                difficulty,
                questType,
                lobbyId,
                bonusClass,
                expiresInHours: Number(expiresInHours),
              })
            }
            disabled={!title || !description || !lobbyId}
            className="btn-game flex-1 text-sm"
          >
            Үүсгэх
          </button>
        </div>
      </div>
    </div>
  );
}
