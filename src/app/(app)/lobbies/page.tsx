"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { SkeletonList } from "@/components/Skeleton";
import { AnimatedList, AnimatedItem, FadeIn } from "@/components/AnimatedList";
import { useLobbies } from "@/lib/swr";
import { toast } from "sonner";

export default function LobbiesPage() {
  const router = useRouter();
  const { lobbies, isLoading, mutate } = useLobbies();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/lobbies/invite")
      .then((r) => r.json())
      .then((d) => setInvites(d.invites || []));
  }, []);

  async function createLobby() {
    const res = await fetch("/api/lobbies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Lobby амжилттай үүслээ!");
    mutate();
    router.push(`/lobbies/${data.lobby.id}`);
  }

  async function respondInvite(inviteId: string, action: "accept" | "decline") {
    const res = await fetch("/api/lobbies/invite", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, action }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    if (action === "accept") {
      toast.success("Lobby-д нэгдлээ!");
      mutate();
      router.push(`/lobbies/${data.lobbyId}`);
    } else {
      toast.info("Урилгыг татгалзлаа");
    }
  }

  async function joinLobby() {
    const res = await fetch("/api/lobbies/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Lobby-д нэгдлээ!");
    mutate();
    router.push(`/lobbies/${data.lobby.id}`);
  }

  return (
    <>
      <TopBar title="Party" showBack />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <AnimatedItem>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn-game text-center text-sm">
              + Create Lobby
            </button>
            <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn-game-outline text-center text-sm">
              Join by Code
            </button>
          </div>
        </AnimatedItem>

        {showCreate && (
          <AnimatedItem>
            <div className="game-card p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold">Create New Lobby</h3>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lobby name..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all placeholder:text-muted-foreground/50"
              />
              <div className="flex gap-2">
                <button onClick={createLobby} className="btn-game flex-1 text-sm">Create</button>
                <button onClick={() => setShowCreate(false)} className="btn-game-outline text-sm px-4">Cancel</button>
              </div>
            </div>
          </AnimatedItem>
        )}

        {showJoin && (
          <AnimatedItem>
            <div className="game-card p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold">Join by Code</h3>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                maxLength={6}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.3em] text-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all placeholder:text-muted-foreground/50 placeholder:text-sm placeholder:tracking-normal placeholder:font-normal"
              />
              <div className="flex gap-2">
                <button onClick={joinLobby} className="btn-game flex-1 text-sm">Join</button>
                <button onClick={() => setShowJoin(false)} className="btn-game-outline text-sm px-4">Cancel</button>
              </div>
            </div>
          </AnimatedItem>
        )}

        {invites.length > 0 && (
          <AnimatedItem>
            <h3 className="font-display text-sm font-semibold mb-3">Pending Invites</h3>
            <div className="space-y-2">
              {invites.map((inv: any) => (
                <div key={inv.id} className="game-card p-4 ring-1 ring-neon-purple/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="emoji-ring text-lg">💌</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{inv.lobby.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.sender.displayName} (@{inv.sender.username}) урьсан · {inv.lobby._count.members} members
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondInvite(inv.id, "accept")} className="btn-game flex-1 text-sm text-center">
                      Accept
                    </button>
                    <button onClick={() => respondInvite(inv.id, "decline")} className="btn-game-outline flex-1 text-sm text-center">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedItem>
        )}

        <AnimatedItem>
          <h3 className="font-display text-sm font-semibold mb-3">Your Lobbies</h3>
          {isLoading ? (
            <SkeletonList count={2} />
          ) : lobbies.length === 0 ? (
            <div className="game-card p-10 text-center">
              <div className="emoji-ring mx-auto mb-4 w-16 h-16 text-2xl">🏠</div>
              <p className="font-display text-sm font-semibold mb-1">No lobbies yet</p>
              <p className="text-xs text-muted-foreground">Create one or join with a code!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lobbies.map((lobby: any) => (
                <button
                  key={lobby.id}
                  onClick={() => router.push(`/lobbies/${lobby.id}`)}
                  className="game-card p-4 w-full text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-semibold text-foreground">{lobby.name}</h4>
                    <span className="font-mono text-xs font-bold text-neon-purple bg-neon-purple/10 px-2.5 py-1 rounded-lg tracking-wider">
                      {lobby.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="stat-chip">👥 {lobby.members.length}</span>
                    <span className="stat-chip">⚡ {lobby._count.quests}</span>
                    <span className="stat-chip">🎮 {lobby._count.qaSessions}</span>
                  </div>
                  <div className="avatar-stack">
                    {lobby.members.slice(0, 4).map((m: any, i: number) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-neon-purple/15 flex items-center justify-center text-[10px] font-bold text-neon-purple"
                      >
                        {m.user.displayName[0]}
                      </div>
                    ))}
                    {lobby.members.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        +{lobby.members.length - 4}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
