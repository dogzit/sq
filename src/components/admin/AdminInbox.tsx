"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import type { AdminData } from "@/lib/admin/types";

export default function AdminInbox({ data }: { data: AdminData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const subs = data.stats.pendingSubmissionCount;
  const quests = data.stats.pendingQuestTemplateCount;
  const trivia = data.stats.pendingTriviaCount;
  const total = subs + quests + trivia;

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg transition-all ${
          open || total > 0
            ? "text-foreground bg-secondary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        aria-label="Pending requests"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-neon-red text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background animate-pulse">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[92vw] z-50 origin-top-right">
          <div className="game-card p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-lg">📥</span>
                <h3 className="font-display text-sm font-bold">Хүлээгдэж буй</h3>
              </div>
              <span className="pill bg-neon-red/10 text-neon-red font-mono">{total}</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {total === 0 ? (
                <div className="px-4 py-10 text-center space-y-2">
                  <div className="text-3xl">✨</div>
                  <p className="text-xs text-muted-foreground">Бүх зүйл цэвэр!</p>
                </div>
              ) : (
                <>
                  <InboxGroup
                    label="Submission (veto хүлээж буй)"
                    href="/admin/submissions"
                    count={subs}
                    emoji="📸"
                    color="text-neon-green"
                  >
                    {data.inbox.pendingSubmissions.slice(0, 3).map((s) => (
                      <InboxRow
                        key={s.id}
                        href={s.quest ? `/quests/${s.quest.id}` : "/admin/submissions"}
                        user={s.user}
                        title={s.quest?.title ?? "Quest устсан"}
                        subtitle={`${s.mediaType === "VIDEO" ? "🎥" : "🖼️"} ${formatTimeAgo(new Date(s.createdAt))}`}
                      />
                    ))}
                  </InboxGroup>

                  <InboxGroup
                    label="User quest (батлуулах)"
                    href="/admin/quest-templates"
                    count={quests}
                    emoji="🎯"
                    color="text-neon-purple"
                  >
                    {data.inbox.pendingQuestTemplates.slice(0, 3).map((q) => (
                      <InboxRow
                        key={q.id}
                        href="/admin/quest-templates"
                        user={q.creator}
                        title={q.title}
                        subtitle={formatTimeAgo(new Date(q.createdAt))}
                      />
                    ))}
                  </InboxGroup>

                  <InboxGroup
                    label="Trivia (батлуулах)"
                    href="/admin/trivia"
                    count={trivia}
                    emoji="🧠"
                    color="text-neon-gold"
                  >
                    {data.inbox.pendingTrivia.slice(0, 3).map((t) => (
                      <InboxRow
                        key={t.id}
                        href="/admin/trivia"
                        user={t.creator}
                        title={t.question}
                        subtitle={formatTimeAgo(new Date(t.createdAt))}
                      />
                    ))}
                  </InboxGroup>
                </>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-border bg-secondary/30">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Бүх хэсэг харах →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InboxGroup({
  label,
  href,
  count,
  emoji,
  color,
  children,
}: {
  label: string;
  href: string;
  count: number;
  emoji: string;
  color: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="px-3 py-3">
      <Link
        href={href}
        className="flex items-center justify-between mb-2 px-1 group"
      >
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          <span>{emoji}</span>
          {label}
        </span>
        <span className={`pill ${color.replace("text-", "bg-")}/10 ${color} font-mono`}>
          {count}
        </span>
      </Link>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InboxRow({
  href,
  user,
  title,
  subtitle,
}: {
  href: string;
  user: { displayName: string; avatarUrl: string | null; username: string };
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/70 transition-colors group"
    >
      <UserAvatar user={user} size={28} linkToProfile={false} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate group-hover:text-neon-purple transition-colors">
          {title}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          @{user.username} · {subtitle}
        </div>
      </div>
    </Link>
  );
}
