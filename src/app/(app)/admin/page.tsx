"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { toast } from "sonner";

interface AdminData {
  stats: { userCount: number; lobbyCount: number; questCount: number; submissionCount: number; sessionCount: number; shopItemCount: number };
  recentUsers: any[];
  activeQuests: any[];
  shopItems: any[];
  lobbies: any[];
}

type Tab = "users" | "quests" | "shop" | "lobbies";

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("users");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [creatingShop, setCreatingShop] = useState(false);
  const [creatingQuest, setCreatingQuest] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  const loadData = useCallback(() => {
    fetch("/api/admin")
      .then((r) => {
        if (r.status === 403) throw new Error("Access denied");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDelete(type: string, id: string) {
    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Delete failed");
        return;
      }
      toast.success("Амжилттай устгалаа");
      setConfirmDelete(null);
      loadData();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleUpdateUser(userId: string, updates: any) {
    try {
      const res = await fetch("/api/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "user", id: userId, ...updates }),
      });
      if (!res.ok) {
        toast.error("Update failed");
        return;
      }
      toast.success("Хэрэглэгч шинэчлэгдлээ");
      setEditingUser(null);
      loadData();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleExpireQuest(questId: string) {
    try {
      const res = await fetch("/api/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quest", id: questId, status: "EXPIRED" }),
      });
      if (!res.ok) {
        toast.error("Update failed");
        return;
      }
      toast.success("Quest expired");
      loadData();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleSaveShopItem(item: any) {
    try {
      const method = item.id ? "PUT" : "POST";
      const body = item.id
        ? { type: "shopItem", ...item }
        : { type: "shopItem", ...item };
      const res = await fetch("/api/admin", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Save failed");
        return;
      }
      toast.success(item.id ? "Шинэчлэгдлээ" : "Үүсгэлээ");
      setEditingShop(null);
      setCreatingShop(false);
      loadData();
    } catch {
      toast.error("Network error");
    }
  }

  if (error) {
    return (
      <>
        <TopBar title="Admin" showBack />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="game-card p-8 text-center max-w-sm">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="font-display text-lg font-bold mb-1">Access Denied</h2>
            <p className="text-sm text-muted-foreground">You don&apos;t have admin privileges.</p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar title="Admin" showBack />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse font-display">Loading admin panel...</div>
        </div>
      </>
    );
  }

  const statCards = [
    { label: "Users", value: data.stats.userCount, emoji: "👥", color: "text-neon-purple" },
    { label: "Lobbies", value: data.stats.lobbyCount, emoji: "🏠", color: "text-neon-blue" },
    { label: "Quests", value: data.stats.questCount, emoji: "⚡", color: "text-neon-gold" },
    { label: "Submissions", value: data.stats.submissionCount, emoji: "📸", color: "text-neon-green" },
    { label: "Games", value: data.stats.sessionCount, emoji: "🎮", color: "text-neon-orange" },
    { label: "Shop", value: data.stats.shopItemCount, emoji: "🛒", color: "text-neon-pink" },
  ];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "users", label: "Users", count: data.recentUsers.length },
    { key: "quests", label: "Quests", count: data.activeQuests.length },
    { key: "shop", label: "Shop", count: data.shopItems.length },
    { key: "lobbies", label: "Lobbies", count: data.lobbies.length },
  ];

  return (
    <>
      <TopBar title="Admin Panel" showBack />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setConfirmDelete(null)}>
          <div className="game-card p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-base font-bold text-center">Устгах уу?</h3>
            <p className="text-sm text-muted-foreground text-center">
              <span className="text-foreground font-medium">{confirmDelete.name}</span> устгахдаа итгэлтэй байна уу?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
              <button onClick={() => handleDelete(confirmDelete.type, confirmDelete.id)} className="flex-1 text-sm py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold">Устгах</button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}

      {/* Shop Item Edit/Create Modal */}
      {(editingShop || creatingShop) && (
        <ShopItemModal
          item={editingShop}
          onClose={() => { setEditingShop(null); setCreatingShop(false); }}
          onSave={handleSaveShopItem}
        />
      )}

      {/* Quest Create Modal */}
      {creatingQuest && (
        <QuestCreateModal
          lobbies={data.lobbies}
          onClose={() => setCreatingQuest(false)}
          onSave={async (quest) => {
            try {
              const res = await fetch("/api/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "quest", ...quest }),
              });
              if (!res.ok) {
                const d = await res.json();
                toast.error(d.error || "Failed");
                return;
              }
              toast.success("Quest үүсгэлээ");
              setCreatingQuest(false);
              loadData();
            } catch {
              toast.error("Network error");
            }
          }}
        />
      )}

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Stats Grid */}
        <AnimatedItem>
          <div className="grid grid-cols-3 gap-2">
            {statCards.map((s) => (
              <div key={s.label} className="game-card p-3 text-center">
                <div className="text-lg mb-1">{s.emoji}</div>
                <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </AnimatedItem>

        {/* Tabs */}
        <AnimatedItem>
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-medium tracking-wide transition-all whitespace-nowrap px-2 ${
                  tab === t.key ? "text-neon-purple border-b-2 border-neon-purple" : "text-muted-foreground"
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </AnimatedItem>

        {/* Tab Content */}
        <AnimatedItem>
          {tab === "users" && (
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
                      <span className="font-mono text-[10px] text-neon-gold">{u.xp} XP</span>
                      <span className="text-[10px] text-muted-foreground">{u.streak} streak</span>
                      {u.emailVerified && <span className="text-[10px] text-neon-green">✓</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditingUser(u)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                    </button>
                    <button onClick={() => setConfirmDelete({ type: "user", id: u.id, name: u.displayName })} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {data.recentUsers.length === 0 && (
                <div className="game-card p-8 text-center text-sm text-muted-foreground">No users yet</div>
              )}
            </div>
          )}

          {tab === "quests" && (
            <div className="space-y-2">
              <button
                onClick={() => setCreatingQuest(true)}
                className="w-full game-card p-4 text-center border-2 border-dashed border-border hover:border-neon-purple/40 transition-all group"
              >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-neon-purple transition-colors">+ Шинэ quest нэмэх</span>
              </button>
              {data.activeQuests.length === 0 ? (
                <div className="game-card p-8 text-center text-sm text-muted-foreground">No active quests</div>
              ) : (
                data.activeQuests.map((q) => (
                  <div key={q.id} className="game-card p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold truncate flex-1">{q.title}</span>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="pill bg-neon-gold/10 text-neon-gold">{q.xpReward} XP</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {q.lobby?.name || "Global"} · {q.difficulty} · {q.questType} · {q._count.submissions} submissions
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleExpireQuest(q.id)} className="text-xs py-1.5 px-3 rounded-lg bg-neon-orange/10 text-neon-orange font-medium hover:bg-neon-orange/20 transition-colors">
                        Expire
                      </button>
                      <button onClick={() => setConfirmDelete({ type: "quest", id: q.id, name: q.title })} className="text-xs py-1.5 px-3 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "shop" && (
            <div className="space-y-2">
              <button
                onClick={() => setCreatingShop(true)}
                className="w-full game-card p-4 text-center border-2 border-dashed border-border hover:border-neon-purple/40 transition-all group"
              >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-neon-purple transition-colors">+ Шинэ item нэмэх</span>
              </button>
              {data.shopItems.map((item) => (
                <div key={item.id} className="game-card p-3.5 flex items-center gap-3">
                  <div className="text-2xl flex-shrink-0">{item.iconEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="pill bg-neon-gold/10 text-neon-gold text-[10px]">{item.price} XP</span>
                      <span className="text-[10px] text-muted-foreground">{item.itemType}</span>
                      <span className="text-[10px] text-muted-foreground">{item._count.purchases} purchased</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditingShop(item)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                    </button>
                    <button onClick={() => setConfirmDelete({ type: "shopItem", id: item.id, name: item.name })} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {data.shopItems.length === 0 && (
                <div className="game-card p-8 text-center text-sm text-muted-foreground">
                  No shop items yet
                </div>
              )}
            </div>
          )}

          {tab === "lobbies" && (
            <div className="space-y-2">
              {data.lobbies.length === 0 ? (
                <div className="game-card p-8 text-center text-sm text-muted-foreground">No lobbies yet</div>
              ) : (
                data.lobbies.map((lobby: any) => (
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
                        {!lobby.isActive && <span className="pill bg-destructive/10 text-destructive text-[10px]">Inactive</span>}
                      </div>
                    </div>
                    <button onClick={() => setConfirmDelete({ type: "lobby", id: lobby.id, name: lobby.name })} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive flex-shrink-0" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}

// ── User Edit Modal ──
function UserEditModal({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: (id: string, u: any) => void }) {
  const [xp, setXp] = useState(String(user.xp));
  const [level, setLevel] = useState(String(user.level));
  const [streak, setStreak] = useState(String(user.streak));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="game-card p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-base font-bold">
          {user.displayName} засах
        </h3>
        <p className="text-xs text-muted-foreground">@{user.username} · {user.email}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">XP</label>
            <input type="number" value={xp} onChange={(e) => setXp(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Level</label>
            <input type="number" value={level} onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Streak</label>
            <input type="number" value={streak} onChange={(e) => setStreak(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button onClick={() => onSave(user.id, { xp: Number(xp), level: Number(level), streak: Number(streak) })} className="btn-game flex-1 text-sm">Хадгалах</button>
        </div>
      </div>
    </div>
  );
}

// ── Shop Item Edit/Create Modal ──
function ShopItemModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (i: any) => void }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(String(item?.price || 100));
  const [itemType, setItemType] = useState(item?.itemType || "TITLE");
  const [value, setValue] = useState(item?.value || "");
  const [iconEmoji, setIconEmoji] = useState(item?.iconEmoji || "🎁");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="game-card p-6 w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-base font-bold">
          {item ? "Shop item засах" : "Шинэ shop item"}
        </h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Emoji</label>
            <input type="text" value={iconEmoji} onChange={(e) => setIconEmoji(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Item description"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Price (XP)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <select value={itemType} onChange={(e) => setItemType(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all">
              <option value="TITLE">TITLE</option>
              <option value="BUFF">BUFF</option>
              <option value="DEBUFF">DEBUFF</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Value</label>
            <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
              placeholder={itemType === "TITLE" ? "Quest Master" : "1.25"}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
            <p className="text-[10px] text-muted-foreground">
              {itemType === "TITLE" ? "Title text" : "XP multiplier (1.25 = +25%, 0.75 = -25%)"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button
            onClick={() => onSave({ ...(item?.id ? { id: item.id } : {}), name, description, price: Number(price), itemType, value, iconEmoji })}
            disabled={!name || !description || !value}
            className="btn-game flex-1 text-sm"
          >
            {item ? "Хадгалах" : "Үүсгэх"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quest Create Modal ──
function QuestCreateModal({ lobbies, onClose, onSave }: { lobbies: any[]; onClose: () => void; onSave: (q: any) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState("50");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [questType, setQuestType] = useState("DAILY");
  const [lobbyId, setLobbyId] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("24");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="game-card p-6 w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-base font-bold">Шинэ Quest</h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Гарчиг</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quest title"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Тайлбар</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quest description" rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">XP</label>
              <input type="number" value={xpReward} onChange={(e) => setXpReward(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Хугацаа (цаг)</label>
              <input type="number" value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Хүндрэл</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="LEGENDARY">Legendary</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Төрөл</label>
              <select value={questType} onChange={(e) => setQuestType(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all">
                <option value="DAILY">Daily</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Lobby (сонголтгүй бол global)</label>
            <select value={lobbyId} onChange={(e) => setLobbyId(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all">
              <option value="">Global (бүх хэрэглэгч)</option>
              {lobbies.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button
            onClick={() => onSave({ title, description, xpReward: Number(xpReward), difficulty, questType, lobbyId: lobbyId || undefined, expiresInHours: Number(expiresInHours) })}
            disabled={!title || !description}
            className="btn-game flex-1 text-sm"
          >
            Үүсгэх
          </button>
        </div>
      </div>
    </div>
  );
}
