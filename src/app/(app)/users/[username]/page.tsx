"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import UserAvatar from "@/components/UserAvatar";

interface ProfileData {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    xp: number;
    coins: number;
    level: number;
    streak: number;
    createdAt: string;
    birthDate: string | null;
    interests: string[];
    isProfileComplete: boolean;
    _count: { submissions: number; achievements: number };
  };
  isSelf: boolean;
  friendship: { id: string; status: string; direction: "outgoing" | "incoming" } | null;
  friendCount: number;
  recentSubmissions: Array<{
    id: string;
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    caption: string | null;
    createdAt: string;
    quest: { title: string };
  }>;
}

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Хэрэглэгч олдсонгүй");
        return;
      }
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function sendRequest() {
    if (!data) return;
    setBusy(true);
    try {
      const res = await fetch("/api/friendships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: data.user.id }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      toast.success(d.autoAccepted ? "Найз болов!" : "Хүсэлт илгээгдлээ");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function respond(action: "ACCEPT" | "DECLINE") {
    if (!data?.friendship) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/friendships/${data.friendship.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error("Алдаа гарлаа");
        return;
      }
      toast.success(action === "ACCEPT" ? "Найз болов!" : "Хүсэлтийг татгалзлаа");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function unfriend() {
    if (!data?.friendship) return;
    if (!confirm("Найзаас хасах уу?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/friendships/${data.friendship.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Алдаа гарлаа");
        return;
      }
      toast.success("Хасагдлаа");
      load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopBar showBack title="..." />
        <div className="px-4 py-6 space-y-3 max-w-md mx-auto">
          <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
          <div className="h-20 rounded-2xl bg-secondary animate-pulse" />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar showBack title="Олдсонгүй" />
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Хэрэглэгч олдсонгүй
        </div>
      </>
    );
  }

  const { user, isSelf, friendship } = data;

  return (
    <>
      <TopBar
        showBack
        title={`@${user.username}`}
        rightAction={
          isSelf ? (
            <button
              onClick={() => router.push("/profile")}
              className="text-xs px-3 py-1.5 rounded-full font-semibold bg-neon-purple/10 text-neon-purple"
            >
              Засах
            </button>
          ) : null
        }
      />

      <AnimatedList className="max-w-md mx-auto px-4 py-4 space-y-3 pb-24">
        {/* Hero card */}
        <AnimatedItem>
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden border border-border">
            <div className="absolute inset-0">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-40" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-purple/20 to-neon-blue/10" />
              )}
            </div>
            <div className="relative h-full flex flex-col items-center justify-center gap-3 p-5">
              <UserAvatar user={user} size={128} linkToProfile={false} ring />
              <div className="text-center">
                <div className="font-display text-xl font-bold">{user.displayName}</div>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
              </div>
              {user.bio && (
                <p className="text-sm text-center text-muted-foreground max-w-[260px] line-clamp-3">
                  {user.bio}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <span className="pill bg-neon-purple/10 text-neon-purple text-xs">Lvl {user.level}</span>
                <span className="pill bg-neon-gold/10 text-neon-gold text-xs">🪙 {user.coins}</span>
                <span className="pill bg-neon-orange/10 text-neon-orange text-xs">🔥 {user.streak}</span>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* Friend / Action button */}
        {!isSelf && (
          <AnimatedItem>
            <div className="game-card p-3">
              {!friendship && (
                <button
                  onClick={sendRequest}
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-neon-purple text-white font-semibold text-sm hover:bg-neon-purple/80 transition disabled:opacity-50"
                >
                  + Найз нэмэх
                </button>
              )}
              {friendship?.status === "PENDING" && friendship.direction === "outgoing" && (
                <button
                  onClick={unfriend}
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm hover:bg-secondary/80 transition disabled:opacity-50"
                >
                  Хүсэлт цуцлах
                </button>
              )}
              {friendship?.status === "PENDING" && friendship.direction === "incoming" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond("ACCEPT")}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-neon-green text-white font-semibold text-sm hover:bg-neon-green/80 transition disabled:opacity-50"
                  >
                    Зөвшөөрөх
                  </button>
                  <button
                    onClick={() => respond("DECLINE")}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm hover:bg-secondary/80 transition disabled:opacity-50"
                  >
                    Татгалзах
                  </button>
                </div>
              )}
              {friendship?.status === "ACCEPTED" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/games?opponent=${user.username}`)}
                    className="flex-1 py-2.5 rounded-xl bg-neon-purple text-white font-semibold text-sm hover:bg-neon-purple/80 transition"
                  >
                    🎮 Тоглох
                  </button>
                  <button
                    onClick={unfriend}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-neon-green/10 text-neon-green font-semibold text-sm hover:bg-neon-red/10 hover:text-neon-red transition disabled:opacity-50"
                  >
                    ✓ Найзууд
                  </button>
                </div>
              )}
            </div>
          </AnimatedItem>
        )}

        {/* Stats grid */}
        <AnimatedItem>
          <div className="grid grid-cols-3 gap-2">
            <div className="game-card p-3 text-center">
              <div className="text-lg font-display font-bold text-neon-purple">{user.xp}</div>
              <div className="text-[10px] text-muted-foreground uppercase">XP</div>
            </div>
            <div className="game-card p-3 text-center">
              <div className="text-lg font-display font-bold text-neon-blue">{data.friendCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Найз</div>
            </div>
            <div className="game-card p-3 text-center">
              <div className="text-lg font-display font-bold text-neon-green">{user._count.submissions}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Quest</div>
            </div>
          </div>
        </AnimatedItem>

        {/* Profile details */}
        {user.isProfileComplete && (user.interests?.length > 0 || user.birthDate) && (
          <AnimatedItem>
            <div className="game-card p-4 space-y-3">
              {user.birthDate && (() => {
                const age = calcAge(user.birthDate);
                return age !== null ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base">🎂</span>
                    <span className="text-muted-foreground">{age} нас</span>
                  </div>
                ) : null;
              })()}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base">📅</span>
                <span className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "short",
                  })}
                  -с нэгдсэн
                </span>
              </div>
              {user.interests?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground mb-1.5">
                    Сонирхол
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests.map((i) => (
                      <span
                        key={i}
                        className="pill bg-neon-purple/10 text-neon-purple text-xs"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatedItem>
        )}

        {/* Recent submissions */}
        <AnimatedItem>
          <div className="text-xs font-bold uppercase text-muted-foreground mb-2 mt-2">Сүүлийн идэвх</div>
          {data.recentSubmissions.length === 0 ? (
            <div className="game-card p-6 text-center text-sm text-muted-foreground">
              Quest хараахан биелүүлээгүй
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {data.recentSubmissions.map((s) => (
                <div key={s.id} className="aspect-square rounded-lg overflow-hidden bg-secondary relative">
                  {s.mediaType === "VIDEO" ? (
                    <video src={s.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.mediaUrl} alt={s.quest.title} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
