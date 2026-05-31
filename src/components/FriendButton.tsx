"use client";

import { useState } from "react";
import { toast } from "sonner";

export type FriendshipState = {
  id: string;
  status: string; // "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED"
  direction: "outgoing" | "incoming";
} | null;

interface Props {
  userId: string;
  friendship: FriendshipState;
  onChange?: () => void;
  size?: "sm" | "md";
  /** Stop click propagation — useful inside <Link> rows */
  stopPropagation?: boolean;
}

export default function FriendButton({
  userId,
  friendship,
  onChange,
  size = "sm",
  stopPropagation = true,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState<FriendshipState | undefined>(undefined);
  const current: FriendshipState = optimistic !== undefined ? optimistic : friendship;

  const wrap = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const baseClass =
    size === "sm"
      ? "text-[11px] px-3 py-1.5 rounded-full font-semibold transition disabled:opacity-50 whitespace-nowrap"
      : "text-sm px-4 py-2 rounded-xl font-semibold transition disabled:opacity-50 whitespace-nowrap";

  async function sendRequest(e: React.MouseEvent) {
    wrap(e);
    setBusy(true);
    try {
      const res = await fetch("/api/friendships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: userId }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      toast.success(d.autoAccepted ? "Найз болов!" : "Хүсэлт илгээгдлээ");
      setOptimistic({
        id: d.friendship.id,
        status: d.friendship.status,
        direction: "outgoing",
      });
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  async function respond(e: React.MouseEvent, action: "ACCEPT" | "DECLINE") {
    wrap(e);
    if (!current) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/friendships/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      toast.success(action === "ACCEPT" ? "Найз болов!" : "Татгалзлаа");
      setOptimistic(
        action === "ACCEPT"
          ? { ...current, status: "ACCEPTED" }
          : null
      );
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: React.MouseEvent) {
    wrap(e);
    if (!current) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/friendships/${current.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Алдаа гарлаа");
        return;
      }
      setOptimistic(null);
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    return (
      <button
        onClick={sendRequest}
        disabled={busy}
        className={`${baseClass} bg-neon-purple text-white hover:bg-neon-purple/80`}
      >
        + Найз
      </button>
    );
  }

  if (current.status === "PENDING" && current.direction === "outgoing") {
    return (
      <button
        onClick={remove}
        disabled={busy}
        className={`${baseClass} bg-secondary text-muted-foreground hover:bg-secondary/80`}
      >
        Хүлээгдэж байна
      </button>
    );
  }

  if (current.status === "PENDING" && current.direction === "incoming") {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={(e) => respond(e, "ACCEPT")}
          disabled={busy}
          className={`${baseClass} bg-neon-green text-white hover:bg-neon-green/80`}
        >
          Зөвшөөр
        </button>
        <button
          onClick={(e) => respond(e, "DECLINE")}
          disabled={busy}
          className={`${baseClass} bg-secondary text-muted-foreground hover:bg-secondary/80`}
        >
          ✕
        </button>
      </div>
    );
  }

  if (current.status === "ACCEPTED") {
    return (
      <button
        onClick={remove}
        disabled={busy}
        className={`${baseClass} bg-neon-green/15 text-neon-green hover:bg-destructive/15 hover:text-destructive`}
      >
        ✓ Найз
      </button>
    );
  }

  // DECLINED/BLOCKED — allow re-sending
  return (
    <button
      onClick={sendRequest}
      disabled={busy}
      className={`${baseClass} bg-neon-purple text-white hover:bg-neon-purple/80`}
    >
      + Найз
    </button>
  );
}
