"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { useLobbies } from "@/lib/swr";

export default function LobbiesPage() {
  const router = useRouter();
  const { lobbies, isLoading, mutate } = useLobbies();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function createLobby() {
    setError("");
    const res = await fetch("/api/lobbies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    mutate();
    router.push(`/lobbies/${data.lobby.id}`);
  }

  async function joinLobby() {
    setError("");
    const res = await fetch("/api/lobbies/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    mutate();
    router.push(`/lobbies/${data.lobby.id}`);
  }

  return (
    <>
      <TopBar title="PARTY" />

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn-neon text-center text-sm">
            + Create Lobby
          </button>
          <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn-neon-magenta text-center text-sm">
            Join by Code
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3 border border-red-400/30">
            {error}
          </div>
        )}

        {showCreate && (
          <div className="card-cyber p-4 space-y-3">
            <h3 className="text-sm font-bold text-[var(--neon-cyan)]">CREATE NEW LOBBY</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lobby name..."
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] transition-all"
            />
            <div className="flex gap-2">
              <button onClick={createLobby} className="btn-neon text-sm flex-1">Create</button>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-secondary)] text-sm px-4">Cancel</button>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="card-cyber p-4 space-y-3">
            <h3 className="text-sm font-bold text-[var(--neon-magenta)]">JOIN BY CODE</h3>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code..."
              maxLength={6}
              className="w-full bg-[var(--bg-primary)] border border-[rgba(255,0,229,0.2)] rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-magenta)] transition-all"
            />
            <div className="flex gap-2">
              <button onClick={joinLobby} className="btn-neon-magenta text-sm flex-1">Join</button>
              <button onClick={() => setShowJoin(false)} className="text-[var(--text-secondary)] text-sm px-4">Cancel</button>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
            Your Lobbies
          </h3>
          {isLoading ? (
            <SkeletonList count={2} />
          ) : lobbies.length === 0 ? (
            <div className="card-cyber p-8 text-center">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-[var(--text-secondary)]">No lobbies yet</p>
              <p className="text-xs text-[var(--text-secondary)]">Create one or join with a code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lobbies.map((lobby: any) => (
                <button
                  key={lobby.id}
                  onClick={() => router.push(`/lobbies/${lobby.id}`)}
                  className="card-cyber p-4 w-full text-left hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-[var(--text-primary)]">{lobby.name}</h4>
                    <span className="text-xs font-mono text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-2 py-1 rounded">
                      {lobby.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span>👥 {lobby.members.length}</span>
                    <span>🎯 {lobby._count.quests}</span>
                    <span>🎮 {lobby._count.qaSessions}</span>
                  </div>
                  <div className="flex -space-x-2 mt-2">
                    {lobby.members.slice(0, 5).map((m: any, i: number) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-[var(--bg-card)] bg-[var(--neon-cyan)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--neon-cyan)]"
                      >
                        {m.user.displayName[0]}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
