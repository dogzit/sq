"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { AnimatedList, AnimatedItem } from "@/components/AnimatedList";
import { useUser } from "@/lib/swr";
import { toast } from "sonner";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  itemType: string;
  value: string;
  iconEmoji: string;
}

interface Purchase {
  id: string;
  used: boolean;
  shopItemId: string;
  item: ShopItem;
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  TITLE: { label: "Title", color: "text-neon-purple", bg: "bg-neon-purple/10" },
  BUFF: { label: "Buff", color: "text-neon-green", bg: "bg-neon-green/10" },
  DEBUFF: { label: "Debuff", color: "text-neon-red", bg: "bg-neon-red/10" },
};

export default function ShopPage() {
  const { user, mutate: mutateUser } = useUser();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchased, setPurchased] = useState<Purchase[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [tab, setTab] = useState<"shop" | "inventory">("shop");

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setPurchased(d.purchased || []);
      });
  }, []);

  async function handleBuy(itemId: string) {
    setBuying(itemId);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopItemId: itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Purchase failed");
        return;
      }
      toast.success("Амжилттай худалдаж авлаа!");
      setPurchased((prev) => [...prev, data.purchase]);
      mutateUser();
    } catch {
      toast.error("Network error");
    } finally {
      setBuying(null);
    }
  }

  async function handleEquipTitle(purchaseId: string) {
    try {
      const res = await fetch("/api/shop/equip-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed");
        return;
      }
      toast.success("Title тавигдлаа!");
      mutateUser();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleUseItem(purchaseId: string, targetUserId: string) {
    try {
      const res = await fetch("/api/shop/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId, targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success("Item ашиглагдлаа!");
      setPurchased((prev) =>
        prev.map((p) => (p.id === purchaseId ? { ...p, used: true } : p))
      );
    } catch {
      toast.error("Network error");
    }
  }

  const unusedItems = purchased.filter((p) => !p.used);

  return (
    <>
      <TopBar title="Shop" />

      <AnimatedList className="px-4 py-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Coin Balance */}
        <AnimatedItem>
          <div className="game-card p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Таны Coin</div>
              <div className="font-mono text-2xl font-bold text-neon-gold">{user?.coins ?? 0}</div>
            </div>
            <div className="text-3xl">🪙</div>
          </div>
        </AnimatedItem>

        {/* Tabs */}
        <AnimatedItem>
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("shop")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                tab === "shop" ? "text-neon-purple border-b-2 border-neon-purple" : "text-muted-foreground"
              }`}
            >
              Дэлгүүр ({items.length})
            </button>
            <button
              onClick={() => setTab("inventory")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                tab === "inventory" ? "text-neon-purple border-b-2 border-neon-purple" : "text-muted-foreground"
              }`}
            >
              Inventory ({unusedItems.length})
            </button>
          </div>
        </AnimatedItem>

        {/* Shop Tab */}
        {tab === "shop" && (
          <AnimatedItem>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="game-card p-8 text-center text-sm text-muted-foreground">
                  Дэлгүүр хоосон байна
                </div>
              ) : (
                items.map((item) => {
                  const tc = typeConfig[item.itemType] || typeConfig.TITLE;
                  const canAfford = (user?.coins ?? 0) >= item.price;
                  const alreadyOwned = item.itemType === "TITLE" && purchased.some((p) => p.shopItemId === item.id);

                  return (
                    <div key={item.id} className="game-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">{item.iconEmoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold">{item.name}</h3>
                            <span className={`pill ${tc.bg} ${tc.color}`}>{tc.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="pill bg-neon-gold/10 text-neon-gold font-mono">
                              🪙 {item.price}
                            </span>
                            {alreadyOwned ? (
                              <span className="text-xs text-neon-green font-medium">Авсан</span>
                            ) : (
                              <button
                                onClick={() => handleBuy(item.id)}
                                disabled={!canAfford || buying === item.id}
                                className={`text-xs py-2 px-4 rounded-xl font-semibold transition-colors ${
                                  canAfford
                                    ? "bg-neon-purple text-white hover:bg-neon-purple/80"
                                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                                }`}
                              >
                                {buying === item.id ? "..." : canAfford ? "Худалдаж авах" : "Coin хүрэхгүй"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </AnimatedItem>
        )}

        {/* Inventory Tab */}
        {tab === "inventory" && (
          <AnimatedItem>
            <div className="space-y-2">
              {unusedItems.length === 0 ? (
                <div className="game-card p-8 text-center">
                  <div className="text-3xl mb-2">🎒</div>
                  <div className="text-sm text-muted-foreground">Inventory хоосон</div>
                </div>
              ) : (
                unusedItems.map((p) => {
                  const tc = typeConfig[p.item.itemType] || typeConfig.TITLE;
                  return (
                    <div key={p.id} className="game-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl flex-shrink-0">{p.item.iconEmoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{p.item.name}</span>
                            <span className={`pill ${tc.bg} ${tc.color}`}>{tc.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.item.description}</p>
                        </div>
                        {p.item.itemType === "TITLE" ? (
                          <button
                            onClick={() => handleEquipTitle(p.id)}
                            className="text-xs py-2 px-3 rounded-xl bg-neon-purple/10 text-neon-purple font-semibold hover:bg-neon-purple/20 transition-colors"
                          >
                            Зүүх
                          </button>
                        ) : (
                          <UseItemButton purchase={p} onUse={handleUseItem} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </AnimatedItem>
        )}
      </AnimatedList>
    </>
  );
}

// Component to select target user and use buff/debuff
function UseItemButton({ purchase, onUse }: { purchase: Purchase; onUse: (id: string, target: string) => void }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const { user } = useUser();

  function handleOpen() {
    setOpen(true);
    // Fetch lobby members to target
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(() => {
        // Get all users from lobbies
        fetch("/api/leaderboard")
          .then((r) => r.json())
          .then((d) => setMembers((d.leaderboard || []).filter((m: any) => m.id !== user?.id)))
          .catch(() => {});
      });
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className={`text-xs py-2 px-3 rounded-xl font-semibold transition-colors ${
          purchase.item.itemType === "BUFF"
            ? "bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
            : "bg-neon-red/10 text-neon-red hover:bg-neon-red/20"
        }`}
      >
        Ашиглах
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
      <div className="game-card p-5 w-full max-w-sm space-y-3 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-sm font-bold">
          {purchase.item.iconEmoji} {purchase.item.name} — Хэн дээр?
        </h3>
        {members.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-1.5">
            {members.map((m: any) => (
              <button
                key={m.id}
                onClick={() => { onUse(purchase.id, m.id); setOpen(false); }}
                className="w-full game-card p-3 flex items-center gap-3 hover:ring-1 hover:ring-neon-purple/40 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-neon-purple/15 flex items-center justify-center text-xs font-bold text-neon-purple">
                  {m.displayName?.[0] || "?"}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{m.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{m.username} · Lvl {m.level}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setOpen(false)} className="btn-game-outline w-full text-sm">Цуцлах</button>
      </div>
    </div>
  );
}
