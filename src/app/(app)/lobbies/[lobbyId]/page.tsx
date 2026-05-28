"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import Link from "next/link";
import { toast } from "sonner";

interface LobbyDetail {
  id: string;
  name: string;
  code: string;
  owner: { id: string; username: string; displayName: string };
  members: {
    xpInLobby: number;
    role: string;
    user: { id: string; username: string; displayName: string; avatarUrl: string | null; xp: number; level: number };
  }[];
  quests: { id: string; title: string; xpReward: number; difficulty: string; expiresAt: string }[];
  qaSessions: { id: string; gameType: string; status: string; createdAt: string }[];
}

export default function LobbyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lobby, setLobby] = useState<LobbyDetail | null>(null);
  const [tab, setTab] = useState<"members" | "quests" | "games">("members");
  const [generating, setGenerating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");

  const lobbyId = params.lobbyId as string;

  useEffect(() => {
    fetch(`/api/lobbies/${lobbyId}`)
      .then((r) => r.json())
      .then((d) => setLobby(d.lobby));
  }, [lobbyId]);

  async function generateQuests() {
    setGenerating(true);
    await fetch("/api/quests/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobbyId }),
    });
    const res = await fetch(`/api/lobbies/${lobbyId}`);
    const d = await res.json();
    setLobby(d.lobby);
    setGenerating(false);
    toast.success("Quests generated!");
  }

  async function startGame() {
    const res = await fetch("/api/qa/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobbyId, gameType: "TRIVIA", roundCount: 5 }),
    });
    const data = await res.json();
    if (data.session) router.push(`/games/${data.session.id}`);
  }

  async function sendInvite() {
    if (!inviteUsername.trim()) return;
    const res = await fetch("/api/lobbies/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobbyId, username: inviteUsername.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(`Invited @${inviteUsername}!`);
    setInviteUsername("");
    setShowInvite(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(lobby?.code || "");
    toast.success("Code copied!");
  }

  if (!lobby) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-muted-foreground animate-pulse font-display">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { key: "members", label: "Members", count: lobby.members.length },
    { key: "quests", label: "Quests", count: lobby.quests.length },
    { key: "games", label: "Games", count: lobby.qaSessions.length },
  ] as const;

  return (
    <>
      <TopBar title={lobby.name} showBack />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Invite Code */}
        <AnimatedItem>
          <div className="game-card p-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-neon-blue/5" />
            <p className="relative text-xs text-muted-foreground mb-2">Invite Code</p>
            <button onClick={copyCode} className="relative font-mono text-3xl font-bold tracking-[0.4em] text-foreground hover:text-neon-purple transition-colors">
              {lobby.code}
            </button>
            <p className="relative text-xs text-muted-foreground mt-1">Tap to copy</p>
          </div>
        </AnimatedItem>

        {/* Actions */}
        <AnimatedItem>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={generateQuests} disabled={generating} className="btn-game text-xs text-center disabled:opacity-50">
              {generating ? "..." : "⚡ Quests"}
            </button>
            <button onClick={startGame} className="btn-game-outline text-xs text-center">
              🎮 Game
            </button>
            <button onClick={() => setShowInvite(!showInvite)} className="btn-game-outline text-xs text-center">
              📨 Invite
            </button>
          </div>
        </AnimatedItem>

        {showInvite && (
          <AnimatedItem>
            <div className="game-card p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold">Invite by Username</h3>
              <input
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="@username"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
              />
              <div className="flex gap-2">
                <button onClick={sendInvite} className="btn-game flex-1 text-sm">Send Invite</button>
                <button onClick={() => setShowInvite(false)} className="btn-game-outline text-sm px-4">Cancel</button>
              </div>
            </div>
          </AnimatedItem>
        )}

        {/* Tabs */}
        <AnimatedItem>
          <div className="flex border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-medium tracking-wide transition-all ${
                  tab === t.key
                    ? "text-neon-purple border-b-2 border-neon-purple"
                    : "text-muted-foreground"
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </AnimatedItem>

        {/* Tab Content */}
        <AnimatedItem>
          {tab === "members" && (
            <div className="space-y-2">
              {lobby.members.map((m, i) => (
                <div key={m.user.id} className="game-card p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-purple/15 ring-2 ring-neon-purple/20 flex items-center justify-center text-sm font-bold text-neon-purple">
                    {i === 0 ? "👑" : m.user.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.user.displayName}</div>
                    <div className="text-xs text-muted-foreground">@{m.user.username} · Lvl {m.user.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-neon-gold">{m.xpInLobby}</div>
                    <div className="text-[10px] text-muted-foreground">XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "quests" && (
            <div className="space-y-2">
              {lobby.quests.length === 0 ? (
                <div className="game-card p-8 text-center">
                  <p className="text-muted-foreground">No active quests</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap &quot;New Quests&quot; to generate!</p>
                </div>
              ) : (
                lobby.quests.map((q) => (
                  <Link key={q.id} href={`/quests/${q.id}`}>
                    <div className="game-card p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{q.title}</div>
                        <span className="pill bg-neon-gold/10 text-neon-gold">⚡ {q.xpReward}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {q.difficulty} · Expires {new Date(q.expiresAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "games" && (
            <div className="space-y-2">
              {lobby.qaSessions.length === 0 ? (
                <div className="game-card p-8 text-center">
                  <p className="text-muted-foreground">No games yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a trivia game!</p>
                </div>
              ) : (
                lobby.qaSessions.map((s) => (
                  <Link key={s.id} href={`/games/${s.id}`}>
                    <div className="game-card p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">🎮 {s.gameType}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`pill ${
                        s.status === "FINISHED" ? "bg-neon-green/10 text-neon-green" :
                        s.status === "IN_PROGRESS" ? "bg-neon-gold/10 text-neon-gold" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
