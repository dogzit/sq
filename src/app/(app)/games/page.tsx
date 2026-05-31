"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { SkeletonList } from "@/components/Skeleton";
import UserAvatar from "@/components/UserAvatar";
import { useUser } from "@/lib/swr";

type GameType = "RPS" | "TTT" | "COIN_FLIP";

const GAME_OPTIONS: { value: GameType; label: string; emoji: string }[] = [
  { value: "RPS", label: "Чулуу-Цаас-Хайч", emoji: "✊" },
  { value: "TTT", label: "Tic-Tac-Toe", emoji: "❌" },
  { value: "COIN_FLIP", label: "Зоос шидэх", emoji: "🪙" },
];

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coins: number;
}

interface Challenge {
  id: string;
  gameType: GameType;
  betAmount: number;
  hostId: string;
  guestId: string;
  status: string;
  createdAt: string;
  host: { id: string; username: string; displayName: string; avatarUrl: string | null };
  guest: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

export default function GamesHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectUsername = searchParams.get("opponent");
  const { user } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [gameType, setGameType] = useState<GameType>("RPS");
  const [bet, setBet] = useState(20);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [fr, ch] = await Promise.all([
        fetch("/api/friendships?status=ACCEPTED").then((r) => r.json()),
        fetch("/api/games/challenges").then((r) => r.json()),
      ]);
      const myId = user?.id;
      const list: Friend[] = (fr.friendships || []).map((f: any) =>
        f.requester.id === myId ? f.addressee : f.requester
      );
      setFriends(list);
      setChallenges(ch.challenges || []);
      if (preselectUsername) {
        const f = list.find((x) => x.username === preselectUsername);
        if (f) setSelectedFriend(f);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function sendChallenge() {
    if (!selectedFriend) {
      toast.error("Найзаа сонгоно уу");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/games/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentId: selectedFriend.id,
          gameType,
          betAmount: bet,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      toast.success("Challenge илгээгдлээ!");
      setSelectedFriend(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function respond(matchId: string, action: "ACCEPT" | "DECLINE") {
    setBusy(true);
    try {
      const res = await fetch(`/api/games/challenges/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      if (action === "ACCEPT") {
        router.push(`/games/${matchId}`);
        return;
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  async function cancel(matchId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/games/challenges/${matchId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        showBack
        title="Games"
        rightAction={
          <div className="text-xs font-mono text-neon-gold">🪙 {user?.coins ?? 0}</div>
        }
      />

      <AnimatedList className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Incoming + outgoing challenges */}
        {challenges.length > 0 && (
          <AnimatedItem>
            <div className="text-xs uppercase text-muted-foreground mb-2">Challenges</div>
            <div className="space-y-2">
              {challenges.map((c) => {
                const incoming = c.guestId === user?.id;
                const other = incoming ? c.host : c.guest;
                const gameLabel = GAME_OPTIONS.find((g) => g.value === c.gameType);
                return (
                  <div key={c.id} className="game-card p-3.5 flex items-center gap-3">
                    <UserAvatar user={other} size={36} linkToProfile={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {gameLabel?.emoji} {other.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {gameLabel?.label} · 🪙 {c.betAmount}
                      </div>
                    </div>
                    {incoming ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => respond(c.id, "ACCEPT")}
                          disabled={busy}
                          className="text-xs py-1.5 px-3 rounded-lg bg-neon-green/15 text-neon-green font-semibold disabled:opacity-40"
                        >
                          Тоглох
                        </button>
                        <button
                          onClick={() => respond(c.id, "DECLINE")}
                          disabled={busy}
                          className="text-xs py-1.5 px-3 rounded-lg bg-destructive/10 text-destructive font-semibold disabled:opacity-40"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => cancel(c.id)}
                        disabled={busy}
                        className="text-xs py-1.5 px-3 rounded-lg bg-secondary text-muted-foreground font-semibold disabled:opacity-40"
                      >
                        Цуцлах
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimatedItem>
        )}

        {/* Create challenge */}
        <AnimatedItem>
          <div className="game-card p-4 space-y-3">
            <div className="text-xs uppercase text-muted-foreground">Шинэ challenge</div>

            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Тоглоом</div>
              <div className="grid grid-cols-3 gap-2">
                {GAME_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGameType(g.value)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      gameType === g.value
                        ? "bg-neon-purple/15 border-neon-purple/60 text-neon-purple"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    <div className="text-lg">{g.emoji}</div>
                    <div className="text-[10px] mt-0.5">{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                Bet: <span className="font-mono text-neon-gold">{bet}</span> 🪙
              </div>
              <input
                type="range"
                min={5}
                max={Math.min(5000, user?.coins ?? 5000)}
                step={5}
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Найз сонго</div>
              {loading ? (
                <SkeletonList count={3} />
              ) : friends.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 bg-secondary rounded-xl text-center">
                  Найз байхгүй байна.{" "}
                  <Link href="/users" className="text-neon-purple underline">
                    Хүмүүс хайх
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFriend(f)}
                      className={`w-full game-card p-2.5 flex items-center gap-2.5 transition-all ${
                        selectedFriend?.id === f.id
                          ? "border-neon-purple/60 bg-neon-purple/5"
                          : ""
                      }`}
                    >
                      <UserAvatar user={f} size={32} linkToProfile={false} />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold truncate">{f.displayName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          @{f.username} · 🪙 {f.coins}
                        </div>
                      </div>
                      {selectedFriend?.id === f.id && (
                        <span className="text-neon-purple text-sm">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={sendChallenge}
              disabled={!selectedFriend || busy || (user?.coins ?? 0) < bet}
              className="btn-game w-full disabled:opacity-40"
            >
              {busy ? "..." : "Challenge илгээх →"}
            </button>
          </div>
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
