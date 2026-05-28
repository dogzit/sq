"use client";

import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function TopBar({ title, showBack, rightAction }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[rgba(0,240,255,0.1)] bg-[var(--bg-primary)]/90 backdrop-blur-lg px-4 py-3">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-[var(--neon-cyan)] hover:neon-glow transition-all text-lg"
          >
            ←
          </button>
        )}
        <h1 className="text-lg font-bold text-[var(--neon-cyan)] neon-glow">
          {title}
        </h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}
