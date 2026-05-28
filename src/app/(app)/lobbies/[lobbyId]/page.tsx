"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Link from "next/link";

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
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

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
    // Refresh
    const res = await fetch(`/api/lobbies/${lobbyId}`);
    const d = await res.json();
    setLobby(d.lobby);
    setGenerating(false);
  }

  async function startGame() {
    const res = await fetch("/api/qa/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lobbyId, gameType: "TRIVIA", roundCount: 5 }),
    });
    const data = await res.json();
    if (data.session) {
      router.push(`/games/${data.session.id}`);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(lobby?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!lobby) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[var(--neon-cyan)] animate-pulse">Loading...</div>
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

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Invite Code */}
        <div className="card-cyber p-4 text-center">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Invite Code
          </p>
          <button onClick={copyCode} className="text-3xl font-mono font-bold tracking-[0.4em] text-[var(--neon-cyan)] neon-glow">
            {lobby.code}
          </button>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {copied ? "Copied! ✓" : "Tap to copy"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={generateQuests} disabled={generating} className="btn-neon text-sm text-center disabled:opacity-50">
            {generating ? "Generating..." : "🎯 New Quests"}
          </button>
          <button onClick={startGame} className="btn-neon-magenta text-sm text-center">
            🎮 Start Game
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(0,240,255,0.15)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t.key
                  ? "text-[var(--neon-cyan)] border-b-2 border-[var(--neon-cyan)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "members" && (
          <div className="space-y-2">
            {lobby.members.map((m, i) => (
              <div key={m.user.id} className="card-cyber p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--neon-cyan)]/20 flex items-center justify-center text-sm font-bold text-[var(--neon-cyan)]">
                  {i === 0 ? "👑" : m.user.displayName[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{m.user.displayName}</div>
                  <div className="text-xs text-[var(--text-secondary)]">@{m.user.username} · Lvl {m.user.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[var(--neon-green)]">{m.xpInLobby}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">XP</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "quests" && (
          <div className="space-y-2">
            {lobby.quests.length === 0 ? (
              <div className="card-cyber p-6 text-center text-[var(--text-secondary)]">
                <p>No active quests</p>
                <p className="text-xs mt-1">Tap &quot;New Quests&quot; to generate!</p>
              </div>
            ) : (
              lobby.quests.map((q) => (
                <Link key={q.id} href={`/quests/${q.id}`}>
                  <div className="card-cyber p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{q.title}</div>
                      <span className="text-xs text-[var(--neon-green)]">+{q.xpReward} XP</span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
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
              <div className="card-cyber p-6 text-center text-[var(--text-secondary)]">
                <p>No games yet</p>
                <p className="text-xs mt-1">Start a trivia game!</p>
              </div>
            ) : (
              lobby.qaSessions.map((s) => (
                <Link key={s.id} href={`/games/${s.id}`}>
                  <div className="card-cyber p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">🎮 {s.gameType}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      s.status === "FINISHED" ? "bg-[var(--neon-green)]/10 text-[var(--neon-green)]" :
                      s.status === "IN_PROGRESS" ? "bg-[var(--neon-yellow)]/10 text-[var(--neon-yellow)]" :
                      "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
