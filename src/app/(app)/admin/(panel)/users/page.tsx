"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin/AdminProvider";
import { adminMutate } from "@/lib/admin/api";
import type { AdminUser, UserUpdatePayload } from "@/lib/admin/types";
import UserEditModal from "@/components/admin/UserEditModal";

export default function AdminUsersPage() {
  const { data, reload, requestDelete } = useAdmin();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  if (!data) return null;

  async function handleUpdateUser(userId: string, updates: UserUpdatePayload) {
    try {
      const res = await adminMutate("PUT", { type: "user", id: userId, ...updates });
      if (!res.ok) {
        toast.error("Шинэчлэхэд алдаа гарлаа");
        return;
      }
      toast.success("Хэрэглэгч шинэчлэгдлээ");
      setEditingUser(null);
      reload();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    }
  }

  return (
    <>
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}

      <div className="space-y-2">
        {data.recentUsers.map((u) => (
          <div key={u.id} className="game-card p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neon-purple/15 flex items-center justify-center text-sm font-bold text-neon-purple flex-shrink-0">
              {u.displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{u.displayName}</div>
              <div className="text-xs text-muted-foreground truncate">@{u.username} · {u.email}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">Lvl {u.level}</span>
                <span className="font-mono text-[10px] text-neon-gold">{u.xp} XP · 🪙{u.coins ?? 0}</span>
                <span className="text-[10px] text-muted-foreground">{u.streak} streak</span>
                {u.emailVerified && <span className="text-[10px] text-neon-green">✓</span>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setEditingUser(u)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Edit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                </svg>
              </button>
              <button
                onClick={() => requestDelete({ type: "user", id: u.id, name: u.displayName })}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {data.recentUsers.length === 0 && (
          <div className="game-card p-8 text-center text-sm text-muted-foreground">No users yet</div>
        )}
      </div>
    </>
  );
}
