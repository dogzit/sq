"use client";

import Link from "next/link";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";

const items = [
  {
    href: "/admin/users",
    label: "Users",
    emoji: "👥",
    color: "text-neon-purple",
    ring: "bg-neon-purple/10 border-neon-purple/30",
    tint: "from-neon-purple/15",
  },
  {
    href: "/admin/quests",
    label: "Quests",
    emoji: "⚡",
    color: "text-neon-gold",
    ring: "bg-neon-gold/10 border-neon-gold/30",
    tint: "from-neon-gold/15",
  },
  {
    href: "/admin/shop",
    label: "Shop",
    emoji: "🛒",
    color: "text-neon-pink",
    ring: "bg-neon-pink/10 border-neon-pink/30",
    tint: "from-neon-pink/15",
  },
  {
    href: "/admin/lobbies",
    label: "Lobbies",
    emoji: "🏠",
    color: "text-neon-blue",
    ring: "bg-neon-blue/10 border-neon-blue/30",
    tint: "from-neon-blue/15",
  },
  {
    href: "/admin/submissions",
    label: "Submissions",
    emoji: "📸",
    color: "text-neon-green",
    ring: "bg-neon-green/10 border-neon-green/30",
    tint: "from-neon-green/15",
  },
  {
    href: "/admin/trivia",
    label: "Trivia",
    emoji: "🧠",
    color: "text-neon-gold",
    ring: "bg-neon-gold/10 border-neon-gold/30",
    tint: "from-neon-gold/15",
  },
  {
    href: "/admin/quest-templates",
    label: "User Quests",
    emoji: "🎯",
    color: "text-neon-purple",
    ring: "bg-neon-purple/10 border-neon-purple/30",
    tint: "from-neon-purple/15",
  },
  {
    href: "/admin/achievements",
    label: "Achievements",
    emoji: "🏆",
    color: "text-neon-gold",
    ring: "bg-neon-gold/10 border-neon-gold/30",
    tint: "from-neon-gold/15",
  },
  {
    href: "/admin/broadcast",
    label: "Broadcast",
    emoji: "📣",
    color: "text-neon-pink",
    ring: "bg-neon-pink/10 border-neon-pink/30",
    tint: "from-neon-pink/15",
  },
  {
    href: "/admin/effects",
    label: "Effects",
    emoji: "✨",
    color: "text-neon-purple",
    ring: "bg-neon-purple/10 border-neon-purple/30",
    tint: "from-neon-purple/15",
  },
  {
    href: "/admin/crons",
    label: "Crons",
    emoji: "⏰",
    color: "text-neon-blue",
    ring: "bg-neon-blue/10 border-neon-blue/30",
    tint: "from-neon-blue/15",
  },
];

export default function AdminDashboardPage() {
  return (
    <AnimatedList className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <AnimatedItem key={it.href}>
          <Link
            href={it.href}
            className="group game-card relative overflow-hidden aspect-square p-5 flex flex-col items-center justify-center gap-3"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${it.tint} via-transparent to-transparent opacity-80`}
            />

            <div
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border ${it.ring} group-hover:scale-110 transition-transform duration-300`}
            >
              {it.emoji}
            </div>

            <div className={`relative font-display text-sm font-bold tracking-wide text-center ${it.color}`}>
              {it.label}
            </div>

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute bottom-3 right-3 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </AnimatedItem>
      ))}
    </AnimatedList>
  );
}
