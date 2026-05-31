"use client";

import type { DeleteTarget } from "@/lib/admin/types";

export default function DeleteConfirmModal({
  target,
  onClose,
  onConfirm,
}: {
  target: DeleteTarget;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="game-card p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base font-bold text-center">Устгах уу?</h3>
        <p className="text-sm text-muted-foreground text-center">
          <span className="text-foreground font-medium">{target.name}</span> устгахдаа итгэлтэй байна уу?
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-game-outline flex-1 text-sm">
            Цуцлах
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-sm py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
}
