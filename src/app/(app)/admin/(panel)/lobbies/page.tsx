"use client";

import { useAdmin } from "@/lib/admin/AdminProvider";

export default function AdminLobbiesPage() {
  const { data, requestDelete } = useAdmin();

  if (!data) return null;

  return (
    <div className="space-y-2">
      {data.lobbies.length === 0 ? (
        <div className="game-card p-8 text-center text-sm text-muted-foreground">No lobbies yet</div>
      ) : (
        data.lobbies.map((lobby) => (
          <div key={lobby.id} className="game-card p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neon-blue/15 flex items-center justify-center text-sm font-bold text-neon-blue flex-shrink-0">
              {lobby.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{lobby.name}</div>
              <div className="text-xs text-muted-foreground">
                Owner: @{lobby.owner.username} · Code: {lobby.code}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{lobby._count.members} members</span>
                <span className="text-[10px] text-muted-foreground">{lobby._count.quests} quests</span>
                {!lobby.isActive && (
                  <span className="pill bg-destructive/10 text-destructive text-[10px]">Inactive</span>
                )}
              </div>
            </div>
            <button
              onClick={() => requestDelete({ type: "lobby", id: lobby.id, name: lobby.name })}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive flex-shrink-0"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))
      )}
    </div>
  );
}
