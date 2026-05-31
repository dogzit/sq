"use client";

import { useState } from "react";
import type { AdminShopItem, ShopItemPayload } from "@/lib/admin/types";
import type { ShopItemType } from "@/generated/prisma/client";
import { fieldInput, fieldLabel } from "@/lib/admin/styles";

export default function ShopItemModal({
  item,
  onClose,
  onSave,
}: {
  item: AdminShopItem | null;
  onClose: () => void;
  onSave: (payload: ShopItemPayload) => void;
}) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(String(item?.price ?? 100));
  const [itemType, setItemType] = useState<ShopItemType>((item?.itemType as ShopItemType) || "TITLE");
  const [value, setValue] = useState(item?.value || "");
  const [iconEmoji, setIconEmoji] = useState(item?.iconEmoji || "🎁");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="game-card p-6 w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base font-bold">
          {item ? "Shop item засах" : "Шинэ shop item"}
        </h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className={fieldLabel}>Emoji</label>
            <input
              type="text"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item description"
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Price (Coins 🪙)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Type</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as ShopItemType)}
              className={fieldInput}
            >
              <option value="TITLE">TITLE</option>
              <option value="BUFF">BUFF</option>
              <option value="DEBUFF">DEBUFF</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className={fieldLabel}>Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={itemType === "TITLE" ? "Quest Master" : "1.25"}
              className={fieldInput}
            />
            <p className="text-[10px] text-muted-foreground">
              {itemType === "TITLE" ? "Title text" : "XP multiplier (1.25 = +25%, 0.75 = -25%)"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">Цуцлах</button>
          <button
            onClick={() =>
              onSave({
                ...(item?.id ? { id: item.id } : {}),
                name,
                description,
                price: Number(price),
                itemType,
                value,
                iconEmoji,
              })
            }
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
