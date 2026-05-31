"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import UserAvatar from "@/components/UserAvatar";

interface DiscoverUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  xp: number;
  streak: number;
  interests: string[];
}

export default function DiscoverUsersPage() {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const d = await res.json();
        setUsers(d.users || []);
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(timeout);
    };
  }, [q]);

  return (
    <>
      <TopBar showBack title="Хүмүүс" />

      <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Нэр эсвэл @username хайх..."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50 mb-4"
        />

        {loading ? (
          <SkeletonList count={6} />
        ) : users.length === 0 ? (
          <div className="game-card p-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm text-muted-foreground">
              {q ? "Хэрэглэгч олдсонгүй" : "Профайлаа бөглөсөн хүмүүс байхгүй байна"}
            </div>
          </div>
        ) : (
          <AnimatedList className="space-y-2">
            {users.map((u) => (
              <AnimatedItem key={u.id}>
                <Link
                  href={`/users/${u.username}`}
                  className="game-card p-3.5 flex items-center gap-3 hover:border-neon-purple/40 transition-all"
                >
                  <UserAvatar user={u} size={44} linkToProfile={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{u.displayName}</span>
                      <span className="pill bg-neon-purple/10 text-neon-purple text-[10px]">
                        Lvl {u.level}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{u.username}
                      {u.bio ? ` · ${u.bio}` : ""}
                    </div>
                    {u.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {u.interests.slice(0, 3).map((i) => (
                          <span key={i} className="text-[10px] text-muted-foreground">
                            #{i}
                          </span>
                        ))}
                        {u.interests.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{u.interests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-bold text-neon-gold">{u.xp}</div>
                    <div className="text-[10px] text-muted-foreground">XP</div>
                  </div>
                </Link>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </>
  );
}
