"use client";

import { useState } from "react";
import { toast } from "sonner";

type CronDef = {
  key: string;
  label: string;
  description: string;
  emoji: string;
  endpoint: string;
};

const crons: CronDef[] = [
  {
    key: "ai-daily-quests",
    label: "AI Daily Quests",
    description: "Идэвхтэй lobby бүрд AI-аар daily quest үүсгэнэ",
    emoji: "⚡",
    endpoint: "/api/cron/ai-daily-quests",
  },
  {
    key: "safe-mode-daily",
    label: "Safe Mode Daily",
    description: "Safe-mode дуусах хугацаа шалгана, цаашид цуцална",
    emoji: "🛡",
    endpoint: "/api/cron/safe-mode-daily",
  },
];

type RunState = {
  status: "idle" | "running" | "ok" | "error";
  message?: string;
  at?: string;
};

export default function AdminCronsPage() {
  const [state, setState] = useState<Record<string, RunState>>({});

  async function run(cron: CronDef) {
    setState((s) => ({ ...s, [cron.key]: { status: "running" } }));
    try {
      const r = await fetch(cron.endpoint, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = d.error || `HTTP ${r.status}`;
        toast.error(`${cron.label}: ${msg}`);
        setState((s) => ({
          ...s,
          [cron.key]: { status: "error", message: msg, at: new Date().toLocaleTimeString() },
        }));
        return;
      }
      toast.success(`${cron.label} ажиллав`);
      setState((s) => ({
        ...s,
        [cron.key]: {
          status: "ok",
          message: JSON.stringify(d),
          at: new Date().toLocaleTimeString(),
        },
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Сүлжээний алдаа";
      toast.error(msg);
      setState((s) => ({
        ...s,
        [cron.key]: { status: "error", message: msg, at: new Date().toLocaleTimeString() },
      }));
    }
  }

  return (
    <div className="space-y-2">
      {crons.map((c) => {
        const st = state[c.key] ?? { status: "idle" as const };
        return (
          <div key={c.key} className="game-card p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="emoji-ring">{c.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground truncate">{c.description}</div>
              </div>
              <button
                disabled={st.status === "running"}
                onClick={() => run(c)}
                className="btn-game text-xs py-2 px-4 disabled:opacity-40"
              >
                {st.status === "running" ? "..." : "Run"}
              </button>
            </div>
            {st.message && (
              <div
                className={`text-[11px] font-mono break-all rounded-lg p-2 ${
                  st.status === "ok"
                    ? "bg-neon-green/10 text-neon-green"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <div className="opacity-60 text-[10px] mb-0.5">{st.at}</div>
                {st.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
