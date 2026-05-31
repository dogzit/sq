"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin/AdminProvider";
import { adminMutate } from "@/lib/admin/api";
import type { QuestCreatePayload } from "@/lib/admin/types";
import QuestCreateModal from "@/components/admin/QuestCreateModal";

export default function AdminQuestsPage() {
  const { data, reload, requestDelete } = useAdmin();
  const [creatingQuest, setCreatingQuest] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!data) return null;

  async function handleExpireQuest(questId: string) {
    try {
      const res = await adminMutate("PUT", { type: "quest", id: questId, status: "EXPIRED" });
      if (!res.ok) {
        toast.error("Шинэчлэхэд алдаа гарлаа");
        return;
      }
      toast.success("Quest хугацаа дууслаа");
      reload();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    }
  }

  async function handleCreateQuest(quest: QuestCreatePayload) {
    try {
      const res = await adminMutate("POST", { type: "quest", ...quest });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Quest үүсгэхэд алдаа гарлаа");
        return;
      }
      toast.success("Quest үүсгэлээ");
      setCreatingQuest(false);
      reload();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    }
  }

  async function handleGenerateQuests() {
    setGenerating(true);
    try {
      const res = await fetch("/api/cron/ai-daily-quests", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || `Quest үүсгэхэд алдаа: HTTP ${res.status}`);
        return;
      }
      if (d.lobbies === 0) {
        toast.error("Идэвхтэй lobby алга");
        return;
      }
      if (d.inserted === 0) {
        toast.error(
          "AI quest үүсгэж чадсангүй (Gemini quota дууссан байж магадгүй)",
        );
        return;
      }
      const expected = (d.lobbies ?? 0) * (d.requestedPerLobby ?? 0);
      if (expected > 0 && d.inserted < expected) {
        toast.warning(
          `${d.inserted}/${expected} AI quest үүсгэлээ — заримд нь алдаа гарсан`,
        );
      } else {
        toast.success(`${d.inserted} AI quest үүсгэлээ (${d.lobbies} lobby)`);
      }
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Сүлжээний алдаа гарлаа");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      {creatingQuest && (
        <QuestCreateModal
          lobbies={data.lobbies}
          onClose={() => setCreatingQuest(false)}
          onSave={handleCreateQuest}
        />
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setCreatingQuest(true)}
            className="flex-1 game-card p-4 text-center border-2 border-dashed border-border hover:border-neon-purple/40 transition-all group"
          >
            <span className="text-sm font-medium text-muted-foreground group-hover:text-neon-purple transition-colors">
              + Шинэ quest
            </span>
          </button>
          <button
            onClick={handleGenerateQuests}
            disabled={generating}
            className="flex-1 game-card p-4 text-center border-2 border-dashed border-neon-gold/30 hover:border-neon-gold/60 transition-all group"
          >
            <span className="text-sm font-medium text-muted-foreground group-hover:text-neon-gold transition-colors">
              {generating ? "Үүсгэж байна..." : "Auto Generate"}
            </span>
          </button>
        </div>
        {data.activeQuests.length === 0 ? (
          <div className="game-card p-8 text-center text-sm text-muted-foreground">No active quests</div>
        ) : (
          data.activeQuests.map((q) => (
            <div key={q.id} className="game-card p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold truncate flex-1">{q.title}</span>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span className="pill bg-neon-gold/10 text-neon-gold">⚡ {q.xpReward}</span>
                  <span className="pill bg-neon-pink/10 text-neon-pink">🪙 {q.coinReward}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {q.lobby?.name ?? "—"} · {q.difficulty} · {q.questType}
                {q.bonusClass && ` · ${q.bonusClass}`}
                {q.isAiGenerated && " · AI"}
                {" · "}{q._count.submissions} submissions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExpireQuest(q.id)}
                  className="text-xs py-1.5 px-3 rounded-lg bg-neon-orange/10 text-neon-orange font-medium hover:bg-neon-orange/20 transition-colors"
                >
                  Expire
                </button>
                <button
                  onClick={() => requestDelete({ type: "quest", id: q.id, name: q.title })}
                  className="text-xs py-1.5 px-3 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
