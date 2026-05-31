"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Channel } from "pusher-js";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { useUser } from "@/lib/swr";
import { getPusherClient, userChannelName } from "@/lib/pusher-client";

type GameType = "RPS" | "TTT" | "COIN_FLIP";

interface MatchInfo {
  id: string;
  gameType: GameType;
  status: string;
  hostId: string;
  guestId: string;
  betAmount: number;
  winnerId: string | null;
  isDraw: boolean;
  state: GameState | null;
  host: { id: string; username: string; displayName: string; avatarUrl: string | null };
  guest: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

type RPSMove = "ROCK" | "PAPER" | "SCISSORS";
type Side = "HEADS" | "TAILS";

interface RPSState {
  type: "RPS";
  moves: Record<string, RPSMove | "HIDDEN">;
  done: boolean;
  winnerId: string | null;
  draw: boolean;
}
interface TTTState {
  type: "TTT";
  board: (null | "X" | "O")[];
  turn: string;
  done: boolean;
  winnerId: string | null;
  draw: boolean;
}
interface CoinFlipState {
  type: "COIN_FLIP";
  hostPick: Side | null;
  result: Side | null;
  done: boolean;
  winnerId: string | null;
  draw: boolean;
}
type GameState = RPSState | TTTState | CoinFlipState;

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { user, mutate: mutateUser } = useUser();

  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [endInfo, setEndInfo] = useState<{
    winnerId: string | null;
    draw: boolean;
    payout: number;
  } | null>(null);
  const channelRef = useRef<Channel | null>(null);

  // Load match metadata + initial (redacted) state
  useEffect(() => {
    fetch(`/api/games/${matchId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast.error(d.error);
          router.push("/games");
          return;
        }
        setMatch(d.match);
        if (d.match.state) setState(d.match.state);
      });
  }, [matchId, router]);

  // Subscribe to the match channel for live updates
  useEffect(() => {
    if (!match || !user) return;
    if (match.status !== "ACTIVE") return;

    const client = getPusherClient();
    if (!client) {
      toast.error("Pusher тохиргоо алга");
      return;
    }

    // RealtimeProvider already opened a subscription to the user channel.
    // We just attach extra bindings for this match.
    const channel = client.subscribe(userChannelName(user.id));
    channelRef.current = channel;

    const onState = (s: GameState & { matchId?: string }) => {
      // Only consume events for this match
      if (s.matchId && s.matchId !== matchId) return;
      setState(s);
    };
    const onEnd = (info: {
      matchId?: string;
      state: GameState;
      winnerId: string | null;
      draw: boolean;
      payout: number;
    }) => {
      if (info.matchId && info.matchId !== matchId) return;
      setState(info.state);
      setEndInfo({ winnerId: info.winnerId, draw: info.draw, payout: info.payout });
      mutateUser();
    };

    channel.bind("match:state", onState);
    channel.bind("match:end", onEnd);

    return () => {
      channel.unbind("match:state", onState);
      channel.unbind("match:end", onEnd);
    };
  }, [match, user, matchId, mutateUser]);

  async function sendMove(move: RPSMove | number | Side) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/games/${matchId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(d.error || "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  if (!match || !user) {
    return (
      <>
        <TopBar showBack title="Match" />
        <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground animate-pulse">
          Loading...
        </div>
      </>
    );
  }

  const isHost = user.id === match.hostId;
  const me = isHost ? match.host : match.guest;
  const opp = isHost ? match.guest : match.host;

  if (match.status === "PENDING") {
    return (
      <>
        <TopBar showBack title="Хүлээгдэж байна" />
        <div className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-sm text-muted-foreground">
            {opp.displayName}-ийн хариуг хүлээж байна
          </p>
        </div>
      </>
    );
  }

  if (match.status === "COMPLETED" || match.status === "CANCELLED") {
    const won = match.winnerId === user.id;
    return (
      <>
        <TopBar showBack title="Дууссан" />
        <div className="max-w-md mx-auto px-4 py-10 text-center space-y-3">
          <div className="text-5xl">
            {match.status === "CANCELLED" ? "❌" : match.isDraw ? "🤝" : won ? "🏆" : "💔"}
          </div>
          <div className="text-lg font-bold">
            {match.status === "CANCELLED"
              ? "Цуцлагдсан"
              : match.isDraw
              ? "Тэнцсэн"
              : won
              ? `+${match.betAmount * 2} 🪙`
              : `-${match.betAmount} 🪙`}
          </div>
          <button onClick={() => router.push("/games")} className="btn-game w-full">
            Games-руу буцах
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar showBack title="Match" />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        <div className="game-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <UserAvatar user={me} size={36} linkToProfile={false} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{me.displayName}</div>
              <div className="text-[10px] text-muted-foreground">Чи</div>
            </div>
          </div>
          <div className="text-xs font-mono text-neon-gold px-2">🪙 {match.betAmount}</div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="min-w-0 text-right">
              <div className="text-sm font-semibold truncate">{opp.displayName}</div>
              <div className="text-[10px] text-muted-foreground">@{opp.username}</div>
            </div>
            <UserAvatar user={opp} size={36} linkToProfile={false} />
          </div>
        </div>

        {!state ? (
          <div className="text-center text-muted-foreground">Ачаалж байна...</div>
        ) : endInfo ? (
          <EndCard
            endInfo={endInfo}
            myId={user.id}
            betAmount={match.betAmount}
            onBack={() => router.push("/games")}
          />
        ) : state.type === "RPS" ? (
          <RPSBoard state={state} myId={user.id} busy={busy} onMove={(m) => sendMove(m)} />
        ) : state.type === "TTT" ? (
          <TTTBoard
            state={state}
            myId={user.id}
            hostId={match.hostId}
            busy={busy}
            onMove={(c) => sendMove(c)}
          />
        ) : state.type === "COIN_FLIP" ? (
          <CoinFlipBoard
            state={state}
            isHost={isHost}
            busy={busy}
            onPick={(s) => sendMove(s)}
          />
        ) : null}
      </div>
    </>
  );
}

function EndCard({
  endInfo,
  myId,
  betAmount,
  onBack,
}: {
  endInfo: { winnerId: string | null; draw: boolean; payout: number };
  myId: string;
  betAmount: number;
  onBack: () => void;
}) {
  const won = endInfo.winnerId === myId;
  return (
    <div className="game-card p-6 text-center space-y-3">
      <div className="text-5xl">{endInfo.draw ? "🤝" : won ? "🏆" : "💔"}</div>
      <div className="text-lg font-bold">
        {endInfo.draw ? "Тэнцсэн" : won ? `+${endInfo.payout} 🪙` : `-${betAmount} 🪙`}
      </div>
      <button onClick={onBack} className="btn-game w-full">
        Games-руу буцах
      </button>
    </div>
  );
}

function RPSBoard({
  state,
  myId,
  busy,
  onMove,
}: {
  state: RPSState;
  myId: string;
  busy: boolean;
  onMove: (m: RPSMove) => void;
}) {
  const myMove = state.moves[myId];
  const hasMoved = myMove && myMove !== "HIDDEN";
  return (
    <div className="game-card p-5 space-y-4">
      <div className="text-center text-sm text-muted-foreground">
        {hasMoved ? "Өрсөлдөгчөө хүлээж байна..." : "Сонголтоо хий"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["ROCK", "PAPER", "SCISSORS"] as const).map((m) => (
          <button
            key={m}
            disabled={busy || !!hasMoved}
            onClick={() => onMove(m)}
            className={`py-6 rounded-2xl text-3xl border-2 transition-all ${
              myMove === m
                ? "bg-neon-purple/20 border-neon-purple"
                : "bg-secondary border-border hover:border-neon-purple/40"
            } disabled:opacity-60`}
          >
            {m === "ROCK" ? "✊" : m === "PAPER" ? "✋" : "✌️"}
          </button>
        ))}
      </div>
    </div>
  );
}

function TTTBoard({
  state,
  myId,
  hostId,
  busy,
  onMove,
}: {
  state: TTTState;
  myId: string;
  hostId: string;
  busy: boolean;
  onMove: (cell: number) => void;
}) {
  const myTurn = state.turn === myId;
  const mySymbol = myId === hostId ? "X" : "O";
  return (
    <div className="game-card p-5 space-y-3">
      <div className="text-center text-sm text-muted-foreground">
        {myTurn ? `Чиний ээлж (${mySymbol})` : "Өрсөлдөгчийн ээлж..."}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {state.board.map((c, i) => (
          <button
            key={i}
            disabled={busy || !myTurn || c !== null}
            onClick={() => onMove(i)}
            className="aspect-square rounded-xl text-3xl font-bold border-2 bg-secondary border-border hover:border-neon-purple/40 disabled:opacity-60 transition-all"
          >
            <span className={c === "X" ? "text-neon-purple" : "text-neon-pink"}>{c ?? ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CoinFlipBoard({
  state,
  isHost,
  busy,
  onPick,
}: {
  state: CoinFlipState;
  isHost: boolean;
  busy: boolean;
  onPick: (s: Side) => void;
}) {
  if (!isHost) {
    return (
      <div className="game-card p-5 space-y-3 text-center">
        <div className="text-4xl">🪙</div>
        <div className="text-sm text-muted-foreground">
          {state.hostPick
            ? `Host: ${state.hostPick}. Зоос шидэж байна...`
            : "Өрсөлдөгч сонголтоо хийж байна..."}
        </div>
      </div>
    );
  }
  return (
    <div className="game-card p-5 space-y-4">
      <div className="text-center text-sm text-muted-foreground">Талыг сонго</div>
      <div className="grid grid-cols-2 gap-3">
        {(["HEADS", "TAILS"] as const).map((s) => (
          <button
            key={s}
            disabled={busy || state.hostPick !== null}
            onClick={() => onPick(s)}
            className="py-8 rounded-2xl bg-secondary border-2 border-border hover:border-neon-purple/40 transition-all disabled:opacity-60"
          >
            <div className="text-3xl">{s === "HEADS" ? "👑" : "🦅"}</div>
            <div className="text-xs font-semibold mt-1">{s}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
