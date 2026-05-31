"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin/AdminProvider";
import { adminMutate } from "@/lib/admin/api";
import type { AdminShopItem, ShopItemPayload } from "@/lib/admin/types";
import ShopItemModal from "@/components/admin/ShopItemModal";

export default function AdminShopPage() {
  const { data, reload, requestDelete } = useAdmin();
  const [editingShop, setEditingShop] = useState<AdminShopItem | null>(null);
  const [creatingShop, setCreatingShop] = useState(false);

  if (!data) return null;

  async function handleSaveShopItem(item: ShopItemPayload) {
    try {
      const method = item.id ? "PUT" : "POST";
      const res = await adminMutate(method, { type: "shopItem", ...item });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Хадгалахад алдаа гарлаа");
        return;
      }
      toast.success(item.id ? "Шинэчлэгдлээ" : "Үүсгэлээ");
      setEditingShop(null);
      setCreatingShop(false);
      reload();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    }
  }

  return (
    <>
      {(editingShop || creatingShop) && (
        <ShopItemModal
          item={editingShop}
          onClose={() => {
            setEditingShop(null);
            setCreatingShop(false);
          }}
          onSave={handleSaveShopItem}
        />
      )}

      <div className="space-y-2">
        <button
          onClick={() => setCreatingShop(true)}
          className="w-full game-card p-4 text-center border-2 border-dashed border-border hover:border-neon-purple/40 transition-all group"
        >
          <span className="text-sm font-medium text-muted-foreground group-hover:text-neon-purple transition-colors">
            + Шинэ item нэмэх
          </span>
        </button>
        {data.shopItems.map((item) => (
          <div key={item.id} className="game-card p-3.5 flex items-center gap-3">
            <div className="text-2xl flex-shrink-0">{item.iconEmoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground truncate">{item.description}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="pill bg-neon-gold/10 text-neon-gold text-[10px]">🪙 {item.price}</span>
                <span className="text-[10px] text-muted-foreground">{item.itemType}</span>
                <span className="text-[10px] text-muted-foreground">{item._count.purchases} purchased</span>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setEditingShop(item)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Edit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                </svg>
              </button>
              <button
                onClick={() => requestDelete({ type: "shopItem", id: item.id, name: item.name })}
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
        {data.shopItems.length === 0 && (
          <div className="game-card p-8 text-center text-sm text-muted-foreground">
            No shop items yet
          </div>
        )}
      </div>
    </>
  );
}
