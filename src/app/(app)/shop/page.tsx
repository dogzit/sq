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
  rarity: string;
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
  XP_BOOST: { label: "XP Boost", color: "text-neon-blue", bg: "bg-neon-blue/10" },
  QUEST_REROLL: { label: "Reroll", color: "text-neon-orange", bg: "bg-neon-orange/10" },
  AVATAR_FRAME: { label: "Frame", color: "text-neon-gold", bg: "bg-neon-gold/10" },
};

const rarityConfig: Record<string, { label: string; border: string; glow: string }> = {
  COMMON: { label: "", border: "border-border", glow: "" },
  RARE: { label: "Rare", border: "border-neon-blue/40", glow: "" },
  EPIC: { label: "Epic", border: "border-neon-purple/50", glow: "shadow-[0_0_12px_rgba(124,92,255,0.15)]" },
  LEGENDARY: { label: "Legendary", border: "border-neon-gold/50", glow: "shadow-[0_0_16px_rgba(255,200,50,0.2)]" },
};

const rarityTextColor: Record<string, string> = {
  COMMON: "text-muted-foreground",
  RARE: "text-neon-blue",
  EPIC: "text-neon-purple",
  LEGENDARY: "text-neon-gold",
};

export default function ShopPage() {
  const { user, mutate: mutateUser } = useUser();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchased, setPurchased] = useState<Purchase[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [tab, setTab] = useState<"shop" | "inventory">("shop");
  const [filter, setFilter] = useState<string>("ALL");

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
        toast.error(data.error || "Худалдаж авахад алдаа гарлаа");
        return;
      }
      toast.success("Амжилттай худалдаж авлаа!");
      setPurchased((prev) => [...prev, data.purchase]);
      mutateUser();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
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
        toast.error(d.error || "Title тавихад алдаа гарлаа");
        return;
      }
      toast.success("Title амжилттай тавигдлаа!");
      mutateUser();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
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
        toast.error(data.error || "Ашиглахад алдаа гарлаа");
        return;
      }
      toast.success("Амжилттай ашиглагдлаа!");
      setPurchased((prev) =>
        prev.map((p) => (p.id === purchaseId ? { ...p, used: true } : p))
      );
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    }
  }

  const unusedItems = purchased.filter((p) => !p.used);
  const itemTypes = ["ALL", ...new Set(items.map((i) => i.itemType))];
  const filteredItems = filter === "ALL" ? items : items.filter((i) => i.itemType === filter);

  return (
    <>
      <TopBar title="Shop" showBack />

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
          <>
            {/* Type Filter */}
            <AnimatedItem>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {itemTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      filter === type
                        ? "bg-neon-purple text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type === "ALL" ? "All" : typeConfig[type]?.label || type}
                  </button>
                ))}
              </div>
            </AnimatedItem>

            <AnimatedItem>
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="game-card p-8 text-center text-sm text-muted-foreground">
                    Дэлгүүр хоосон байна
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const tc = typeConfig[item.itemType] || typeConfig.TITLE;
                    const rc = rarityConfig[item.rarity] || rarityConfig.COMMON;
                    const canAfford = (user?.coins ?? 0) >= item.price;
                    const alreadyOwned = (item.itemType === "TITLE" || item.itemType === "AVATAR_FRAME")
                      && purchased.some((p) => p.shopItemId === item.id);

                    return (
                      <div key={item.id} className={`game-card p-4 ${rc.border} ${rc.glow}`}>
                        <div className="flex items-start gap-3">
                          <div className="text-3xl flex-shrink-0">{item.iconEmoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-sm font-semibold">{item.name}</h3>
                              <span className={`pill ${tc.bg} ${tc.color}`}>{tc.label}</span>
                              {item.rarity !== "COMMON" && (
                                <span className={`text-[10px] font-bold ${rarityTextColor[item.rarity]}`}>
                                  {rc.label}
                                </span>
                              )}
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
          </>
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
                  const isTitle = p.item.itemType === "TITLE";
                  const isFrame = p.item.itemType === "AVATAR_FRAME";
                  const isSelfBuff = p.item.itemType === "XP_BOOST";
                  const isReroll = p.item.itemType === "QUEST_REROLL";

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
                        {isTitle || isFrame ? (
                          <button
                            onClick={() => handleEquipTitle(p.id)}
                            className="text-xs py-2 px-3 rounded-xl bg-neon-purple/10 text-neon-purple font-semibold hover:bg-neon-purple/20 transition-colors"
                          >
                            Зүүх
                          </button>
                        ) : isSelfBuff ? (
                          <button
                            onClick={() => user && handleUseItem(p.id, user.id)}
                            className="text-xs py-2 px-3 rounded-xl bg-neon-blue/10 text-neon-blue font-semibold hover:bg-neon-blue/20 transition-colors"
                          >
                            Идэвхжүүлэх
                          </button>
                        ) : isReroll ? (
                          <span className="text-xs text-muted-foreground">Quest-д ашиглана</span>
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
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setMembers((d.leaderboard || []).filter((m: any) => m.id !== user?.id)))
      .catch(() => {});
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
