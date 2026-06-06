"use client";

import { useMemo, useState } from "react";

export type TocSection = {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  group?: string;
};

export default function HelpToc({ sections }: { sections: TocSection[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.hint.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.group ?? "").toLowerCase().includes(q),
    );
  }, [sections, query]);

  // Group filtered sections preserving the source order
  const groups = useMemo(() => {
    const map = new Map<string, TocSection[]>();
    for (const s of filtered) {
      const g = s.group ?? "Бусад";
      const arr = map.get(g) ?? [];
      arr.push(s);
      map.set(g, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="game-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-base font-bold">Агуулга</h2>
        <span className="pill bg-neon-purple/10 text-neon-purple">
          {filtered.length} / {sections.length}
        </span>
      </div>

      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх — quest, coin, frame, push-up..."
          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all placeholder:text-muted-foreground/60"
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-md"
            aria-label="Цэвэрлэх"
          >
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <div className="text-2xl mb-2">🔍</div>
          Олдсонгүй. Өөр түлхүүр үгээр оролдоорой.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([group, items]) => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 px-1">
                {group}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {items.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 group transition-all"
                    >
                      <span className="text-lg flex-shrink-0">{s.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors truncate">
                          {s.title}
                        </span>
                        <span className="block text-[11px] text-muted-foreground truncate">
                          {s.hint}
                        </span>
                      </span>
                      <span className="text-muted-foreground group-hover:text-neon-purple opacity-0 group-hover:opacity-100 transition-all">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
