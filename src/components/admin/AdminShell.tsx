"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/lib/admin/AdminProvider";
import AdminInbox from "./AdminInbox";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  emoji: string;
  badge?: number;
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data, error } = useAdmin();
  const pathname = usePathname();

  if (error) {
    const denied = error === "Access denied";
    return (
      <>
        <AdminFallbackBar />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="game-card p-8 text-center max-w-sm">
            <div className="text-4xl mb-3">{denied ? "🔒" : "⚠️"}</div>
            <h2 className="font-display text-lg font-bold mb-1">
              {denied ? "Access Denied" : "Алдаа гарлаа"}
            </h2>
            <p className="text-sm text-muted-foreground break-words">
              {denied ? "You don't have admin privileges." : error}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <AdminFallbackBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse font-display">
            Loading admin panel...
          </div>
        </div>
      </>
    );
  }

  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", emoji: "📊" },
    {
      href: "/admin/submissions",
      label: "Submissions",
      emoji: "📸",
      badge: data.stats.pendingSubmissionCount,
    },
    {
      href: "/admin/quest-templates",
      label: "User Quests",
      emoji: "🎯",
      badge: data.stats.pendingQuestTemplateCount,
    },
    {
      href: "/admin/trivia",
      label: "Trivia",
      emoji: "🧠",
      badge: data.stats.pendingTriviaCount,
    },
    { href: "/admin/users", label: "Users", emoji: "👥" },
    { href: "/admin/quests", label: "Quests", emoji: "⚡" },
    { href: "/admin/lobbies", label: "Lobbies", emoji: "🏠" },
    { href: "/admin/shop", label: "Shop", emoji: "🛒" },
    { href: "/admin/achievements", label: "Achievements", emoji: "🏆" },
    { href: "/admin/effects", label: "Effects", emoji: "✨" },
    { href: "/admin/broadcast", label: "Broadcast", emoji: "📣" },
    { href: "/admin/crons", label: "Crons", emoji: "⏰" },
  ];

  return (
    <>
      {/* ───── Top bar (custom — replaces shared TopBar) ───── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              aria-label="Аппаас гарах"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold tracking-tight flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-neon-red/15 text-neon-red">
                  Admin
                </span>
                <span className="truncate">
                  {nav.find((n) => isActive(n.href, pathname))?.label ?? "Panel"}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <AdminInbox data={data} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ───── Body: sidebar (lg+) + main ───── */}
      <div className="max-w-7xl mx-auto lg:flex lg:gap-6 lg:px-6 lg:py-6">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <nav className="sticky top-[68px] space-y-1">
            {nav.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-neon-purple/10 text-neon-purple ring-1 ring-neon-purple/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  {(item.badge ?? 0) > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-neon-red text-[10px] font-bold text-white flex items-center justify-center">
                      {item.badge! > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile sub-nav (horizontal scroll) — visible only when not on /admin root */}
        {pathname !== "/admin" && (
          <div className="lg:hidden border-b border-border/50 bg-background/60">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar px-4 py-2 snap-x">
              {nav.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative snap-start flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      active
                        ? "bg-neon-purple text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    {item.label}
                    {(item.badge ?? 0) > 0 && (
                      <span className="min-w-[16px] h-4 px-1 rounded-full bg-neon-red text-[9px] font-bold text-white flex items-center justify-center">
                        {item.badge! > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 py-4 lg:py-0 lg:px-0 pb-24">
          {children}
        </main>
      </div>
    </>
  );
}

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function AdminFallbackBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <h1 className="font-display text-base font-bold flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-neon-red/15 text-neon-red">
            Admin
          </span>
          Panel
        </h1>
      </div>
    </header>
  );
}
