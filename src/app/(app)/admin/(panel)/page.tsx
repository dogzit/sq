"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/admin/AdminProvider";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import UserAvatar from "@/components/UserAvatar";
import { formatTimeAgo } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data } = useAdmin();
  if (!data) return null;

  const s = data.stats;

  return (
    <AnimatedList className="space-y-6 lg:space-y-8">
      {/* ── STAT TILES ────────────────────────────── */}
      <AnimatedItem>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Users" value={s.userCount} delta={s.last24hUserCount} color="text-neon-purple" emoji="👥" />
          <Stat label="Lobbies" value={s.lobbyCount} color="text-neon-blue" emoji="🏠" />
          <Stat label="Quests" value={s.questCount} sub={`${s.activeQuestCount} active`} color="text-neon-gold" emoji="⚡" />
          <Stat label="Submissions" value={s.submissionCount} delta={s.last24hSubmissionCount} color="text-neon-green" emoji="📸" />
          <Stat label="Shop items" value={s.shopItemCount} color="text-neon-pink" emoji="🛒" />
          <Stat label="Pending" value={s.pendingSubmissionCount + s.pendingQuestTemplateCount + s.pendingTriviaCount} color="text-neon-red" emoji="🚨" />
        </div>
      </AnimatedItem>

      {/* ── PENDING ACTION PANELS ──────────────────── */}
      <AnimatedItem>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PendingPanel
            title="Submission Veto"
            href="/admin/submissions"
            count={s.pendingSubmissionCount}
            emoji="📸"
            color="text-neon-green"
            ring="border-neon-green/30"
            empty="Шинэ submission байхгүй"
          >
            {data.inbox.pendingSubmissions.slice(0, 4).map((it) => (
              <PendingRow
                key={it.id}
                href={it.quest ? `/quests/${it.quest.id}` : "/admin/submissions"}
                user={it.user}
                title={it.quest?.title ?? "Quest устсан"}
                subtitle={`${it.mediaType === "VIDEO" ? "🎥" : "🖼️"} ${formatTimeAgo(new Date(it.createdAt))}`}
              />
            ))}
          </PendingPanel>

          <PendingPanel
            title="User Quest батлах"
            href="/admin/quest-templates"
            count={s.pendingQuestTemplateCount}
            emoji="🎯"
            color="text-neon-purple"
            ring="border-neon-purple/30"
            empty="Шинэ санал байхгүй"
          >
            {data.inbox.pendingQuestTemplates.slice(0, 4).map((it) => (
              <PendingRow
                key={it.id}
                href="/admin/quest-templates"
                user={it.creator}
                title={it.title}
                subtitle={formatTimeAgo(new Date(it.createdAt))}
              />
            ))}
          </PendingPanel>

          <PendingPanel
            title="Trivia батлах"
            href="/admin/trivia"
            count={s.pendingTriviaCount}
            emoji="🧠"
            color="text-neon-gold"
            ring="border-neon-gold/30"
            empty="Шинэ асуулт байхгүй"
          >
            {data.inbox.pendingTrivia.slice(0, 4).map((it) => (
              <PendingRow
                key={it.id}
                href="/admin/trivia"
                user={it.creator}
                title={it.question}
                subtitle={formatTimeAgo(new Date(it.createdAt))}
              />
            ))}
          </PendingPanel>
        </div>
      </AnimatedItem>

      {/* ── QUICK NAV (mobile primarily; desktop has the sidebar) ── */}
      <AnimatedItem>
        <div className="lg:hidden">
          <SectionHeader title="Хэсэг сонгох" />
          <QuickNav />
        </div>
      </AnimatedItem>

      {/* ── RECENT ACTIVITY ─────────────────────── */}
      <AnimatedItem>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <SectionHeader title="Шинээр бүртгүүлсэн" href="/admin/users" />
            <div className="game-card divide-y divide-border p-0 overflow-hidden">
              {data.recentUsers.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-neon-purple/15 flex items-center justify-center text-xs font-bold text-neon-purple flex-shrink-0">
                    {u.displayName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{u.displayName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      @{u.username} · Lvl {u.level} · {formatTimeAgo(new Date(u.createdAt))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-xs text-neon-gold">{u.xp.toLocaleString()} XP</div>
                    <div className="text-[10px] text-muted-foreground">🪙 {u.coins.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Идэвхтэй Quest" href="/admin/quests" />
            <div className="game-card divide-y divide-border p-0 overflow-hidden">
              {data.activeQuests.slice(0, 6).map((q) => (
                <Link
                  key={q.id}
                  href={`/quests/${q.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors group"
                >
                  <div className="text-base flex-shrink-0">
                    {q.questType === "EMERGENCY" ? "🚨" : "⚡"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate group-hover:text-neon-purple transition-colors">
                      {q.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {q.lobby?.name ?? "Global"} · {q.difficulty.toLowerCase()} · {q._count.submissions} sub
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-xs text-neon-gold">+{q.xpReward}</div>
                    <div className="text-[10px] text-muted-foreground">{formatTimeAgo(new Date(q.expiresAt))}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </AnimatedItem>
    </AnimatedList>
  );
}

/* ────────────────────────────────────────── */

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>
      {href && (
        <Link href={href} className="text-[11px] text-neon-purple hover:underline">
          бүгд →
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  sub,
  color,
  emoji,
}: {
  label: string;
  value: number;
  delta?: number;
  sub?: string;
  color: string;
  emoji: string;
}) {
  return (
    <div className="game-card p-3 lg:p-4 relative overflow-hidden">
      <div className="absolute -top-2 -right-2 text-3xl opacity-10">{emoji}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className={`font-mono text-2xl lg:text-3xl font-bold ${color} mt-1`}>
        {value.toLocaleString()}
      </div>
      {delta !== undefined && delta > 0 && (
        <div className="text-[10px] text-neon-green mt-0.5">+{delta} 24ц</div>
      )}
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function PendingPanel({
  title,
  href,
  count,
  emoji,
  color,
  ring,
  empty,
  children,
}: {
  title: string;
  href: string;
  count: number;
  emoji: string;
  color: string;
  ring: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hot = count > 0;
  return (
    <div className={`game-card p-0 overflow-hidden flex flex-col ${hot ? ring : ""}`}>
      <Link
        href={href}
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 hover:bg-secondary/60 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{emoji}</span>
          <h3 className={`font-display text-sm font-bold ${color} truncate`}>
            {title}
          </h3>
        </div>
        {hot ? (
          <span className={`pill bg-neon-red/15 text-neon-red font-mono animate-pulse`}>
            {count}
          </span>
        ) : (
          <span className="pill bg-secondary text-muted-foreground font-mono">0</span>
        )}
      </Link>
      <div className="flex-1 min-h-[140px] divide-y divide-border">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-1">
            <div className="text-2xl opacity-50">✨</div>
            <p className="text-xs text-muted-foreground">{empty}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function PendingRow({
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
      className="flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/50 transition-colors group"
    >
      <UserAvatar user={user} size={26} linkToProfile={false} />
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

/* ── Mobile-only quick navigation grid ── */
const quickNavItems = [
  { href: "/admin/users",            label: "Users",        emoji: "👥", tint: "from-neon-purple/15", color: "text-neon-purple" },
  { href: "/admin/quests",           label: "Quests",       emoji: "⚡", tint: "from-neon-gold/15",   color: "text-neon-gold" },
  { href: "/admin/shop",             label: "Shop",         emoji: "🛒", tint: "from-neon-pink/15",   color: "text-neon-pink" },
  { href: "/admin/lobbies",          label: "Lobbies",      emoji: "🏠", tint: "from-neon-blue/15",   color: "text-neon-blue" },
  { href: "/admin/submissions",      label: "Submissions",  emoji: "📸", tint: "from-neon-green/15",  color: "text-neon-green" },
  { href: "/admin/trivia",           label: "Trivia",       emoji: "🧠", tint: "from-neon-gold/15",   color: "text-neon-gold" },
  { href: "/admin/quest-templates",  label: "User Quests",  emoji: "🎯", tint: "from-neon-purple/15", color: "text-neon-purple" },
  { href: "/admin/achievements",     label: "Achievements", emoji: "🏆", tint: "from-neon-gold/15",   color: "text-neon-gold" },
  { href: "/admin/broadcast",        label: "Broadcast",    emoji: "📣", tint: "from-neon-pink/15",   color: "text-neon-pink" },
  { href: "/admin/effects",          label: "Effects",      emoji: "✨", tint: "from-neon-purple/15", color: "text-neon-purple" },
  { href: "/admin/crons",            label: "Crons",        emoji: "⏰", tint: "from-neon-blue/15",   color: "text-neon-blue" },
];

function QuickNav() {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {quickNavItems.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="game-card relative overflow-hidden aspect-square p-3 flex flex-col items-center justify-center gap-1.5 group"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${it.tint} via-transparent to-transparent`} />
          <div className="relative text-2xl group-hover:scale-110 transition-transform">
            {it.emoji}
          </div>
          <div className={`relative text-[11px] font-semibold text-center ${it.color}`}>
            {it.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
