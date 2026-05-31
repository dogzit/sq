"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { AdminSubmission } from "@/lib/admin/types";
import type { VetoStatus } from "@/generated/prisma/client";

type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const filters: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Бүгд" },
  { key: "PENDING", label: "Хүлээж буй" },
  { key: "APPROVED", label: "Зөвшөөрсөн" },
  { key: "REJECTED", label: "Татгалзсан" },
];

export default function AdminSubmissionsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [items, setItems] = useState<AdminSubmission[] | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    const url = filter === "ALL" ? "/api/admin/submissions" : `/api/admin/submissions?status=${filter}`;
    const r = await fetch(url);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      toast.error(d.error || "Уншиж чадсангүй");
      setItems([]);
      return;
    }
    setItems(d.submissions || []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setVerdict(id: string, vetoStatus: VetoStatus) {
    setActing(id);
    try {
      const r = await fetch("/api/admin/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, vetoStatus }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || "Алдаа");
        return;
      }
      toast.success("Шинэчлэгдлээ");
      load();
    } finally {
      setActing(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Submission устгах уу?")) return;
    setActing(id);
    try {
      const r = await fetch("/api/admin/submissions", {
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
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`pill whitespace-nowrap ${
              filter === f.key
                ? "bg-neon-purple/20 text-neon-purple"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="game-card p-8 text-center text-sm text-muted-foreground animate-pulse">
          Уншиж байна...
        </div>
      ) : items.length === 0 ? (
        <div className="game-card p-8 text-center text-sm text-muted-foreground">
          Submission байхгүй
        </div>
      ) : (
        items.map((s) => (
          <div key={s.id} className="game-card p-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                {s.mediaType === "IMAGE" ? (
                  <Image src={s.mediaUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{s.quest.title}</div>
                <div className="text-xs text-muted-foreground truncate">@{s.user.username}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`pill text-[10px] ${
                      s.vetoStatus === "APPROVED"
                        ? "bg-neon-green/10 text-neon-green"
                        : s.vetoStatus === "REJECTED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-neon-gold/10 text-neon-gold"
                    }`}
                  >
                    {s.vetoStatus}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ✓ {s.approveCount} · ✗ {s.rejectCount}
                  </span>
                  {s.xpAwarded > 0 && (
                    <span className="text-[10px] text-neon-gold font-mono">+{s.xpAwarded} XP</span>
                  )}
                </div>
              </div>
            </div>
            {s.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2">{s.caption}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <button
                disabled={acting === s.id || s.vetoStatus === "APPROVED"}
                onClick={() => setVerdict(s.id, "APPROVED")}
                className="text-xs py-1.5 px-3 rounded-lg bg-neon-green/10 text-neon-green font-medium hover:bg-neon-green/20 transition-colors disabled:opacity-40"
              >
                Зөвшөөрөх
              </button>
              <button
                disabled={acting === s.id || s.vetoStatus === "REJECTED"}
                onClick={() => setVerdict(s.id, "REJECTED")}
                className="text-xs py-1.5 px-3 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors disabled:opacity-40"
              >
                Татгалзах
              </button>
              <button
                disabled={acting === s.id}
                onClick={() => remove(s.id)}
                className="text-xs py-1.5 px-3 rounded-lg bg-secondary text-muted-foreground font-medium hover:bg-secondary/80 transition-colors ml-auto disabled:opacity-40"
              >
                Устгах
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
