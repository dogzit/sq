"use client";

import Link from "next/link";

const diffConfig: Record<string, { color: string; bg: string }> = {
  EASY: { color: "text-neon-green", bg: "bg-neon-green/10" },
  MEDIUM: { color: "text-blue-400", bg: "bg-blue-400/10" },
  HARD: { color: "text-neon-orange", bg: "bg-neon-orange/10" },
  LEGENDARY: { color: "text-neon-red", bg: "bg-neon-red/10" },
};

function formatTimeLeft(expiresAt: string) {
  // eslint-disable-next-line react-hooks/purity -- benign read of current time for a "time left" badge
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

// Extracts the leading emoji (incl. ZWJ-sequences and variation selectors) from a string.
function splitLeadingEmoji(text: string): { emoji: string | null; rest: string } {
  if (!text) return { emoji: null, rest: text };
  const trimmed = text.trimStart();
  const match = trimmed.match(
    /^(\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*)\s*/u,
  );
  if (!match) return { emoji: null, rest: text };
  return { emoji: match[1], rest: trimmed.slice(match[0].length) };
}

// NONE → PENDING → REJECTED → APPROVED (done sinks to bottom).
export function questRank(q: any): number {
  const s = q.submissions?.[0]?.vetoStatus ?? "NONE";
  if (s === "APPROVED") return 3;
  if (s === "REJECTED") return 2;
  if (s === "PENDING") return 1;
  return 0;
}

export function sortQuestsByDoneLast(quests: any[]): any[] {
  return [...quests].sort((a, b) => {
    const r = questRank(a) - questRank(b);
    if (r !== 0) return r;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });
}

export default function QuestCard({ quest }: { quest: any }) {
  const sub = quest.submissions?.[0];
  const status: "NONE" | "PENDING" | "APPROVED" | "REJECTED" = sub
    ? (sub.vetoStatus as "PENDING" | "APPROVED" | "REJECTED")
    : "NONE";
  const done = status === "APPROVED";
  const votesToCast = quest._count?.submissions ?? 0;
  const diff = diffConfig[quest.difficulty] || {
    color: "text-muted-foreground",
    bg: "bg-secondary",
  };

  const ringClass = done
    ? "opacity-60 ring-1 ring-neon-green/30 bg-neon-green/5"
    : status === "REJECTED"
      ? "opacity-75 ring-1 ring-destructive/25 bg-destructive/5"
      : status === "PENDING"
        ? "ring-1 ring-neon-gold/30 bg-neon-gold/5"
        : "";

  const { emoji: titleEmoji, rest: titleText } = splitLeadingEmoji(quest.title);
  const leadIcon =
    titleEmoji ??
    (quest.questType === "EMERGENCY" ? "⚡" : "🎯");

  return (
    <Link href={`/quests/${quest.id}`}>
      <div className={`game-card p-4 relative ${ringClass}`}>
        {votesToCast > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-neon-red text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background"
            title={`${votesToCast} submission${votesToCast === 1 ? "" : "s"} awaiting your vote`}
          >
            {votesToCast > 9 ? "9+" : votesToCast}
          </span>
        )}
        <div className="flex items-start gap-3">
          <div className="emoji-ring text-lg flex-shrink-0 relative">
            {leadIcon}
            {status !== "NONE" && (
              <span
                className="absolute -bottom-1 -right-1 text-[11px] leading-none bg-card rounded-full px-0.5 ring-1 ring-border"
                title={status}
              >
                {status === "APPROVED" ? "✅" : status === "REJECTED" ? "❌" : "⏳"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`text-sm font-semibold truncate ${
                  done ? "text-neon-green line-through decoration-1" : ""
                }`}
              >
                {titleText || quest.title}
              </h3>
              {done && (
                <span className="pill bg-neon-green/10 text-neon-green">✓</span>
              )}
              {quest.questType === "EMERGENCY" && (
                <span className="pill bg-neon-red/15 text-neon-red animate-glow-pulse">
                  EMERGENCY
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {quest.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`pill ${diff.bg} ${diff.color}`}>
                {quest.difficulty}
              </span>
              <span className="pill bg-neon-gold/10 text-neon-gold">
                ⚡ {quest.xpReward}
              </span>
              <span className="pill bg-secondary text-muted-foreground">
                {formatTimeLeft(quest.expiresAt)}
              </span>
              {quest.lobby?.name && (
                <span className="text-[10px] text-muted-foreground truncate">
                  · 👥 {quest.lobby.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
