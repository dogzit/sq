"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  currentSubscription,
  notificationPermission,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type State = "loading" | "unsupported" | "denied" | "off" | "on";

export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!pushSupported()) {
      setState("unsupported");
      return;
    }
    const perm = notificationPermission();
    if (perm === "denied") {
      setState("denied");
      return;
    }
    const sub = await currentSubscription();
    setState(sub ? "on" : "off");
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (state === "on") {
        await unsubscribeFromPush();
        toast.success("Push notification идэвхгүй боллоо");
      } else {
        const res = await subscribeToPush();
        if (res.ok) {
          toast.success("Push notification идэвхжлээ");
        } else {
          toast.error(res.message);
        }
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      if (!res.ok) {
        toast.error("Илгээж чадсангүй");
      } else {
        toast.success("Тест push илгээлээ");
      }
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  if (state === "unsupported") {
    return (
      <div className="game-card p-3 text-xs text-muted-foreground">
        Энэ browser Web Push дэмждэггүй
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="game-card p-3 text-xs">
        <div className="font-semibold mb-1">🔕 Notification хаагдсан</div>
        <div className="text-muted-foreground">
          Browser-ийн тохиргооноос дахин зөвшөөрнө үү.
        </div>
      </div>
    );
  }

  return (
    <div className="game-card p-3 flex items-center gap-2">
      <div className="text-xl">{state === "on" ? "🔔" : "🔕"}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">
          {state === "on" ? "Push идэвхтэй" : "Push идэвхгүй"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Утсанд тань шууд ирнэ
        </div>
      </div>
      {state === "on" && (
        <button
          onClick={sendTest}
          disabled={busy}
          className="text-[11px] px-3 py-1.5 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 disabled:opacity-50"
        >
          Тест
        </button>
      )}
      <button
        onClick={toggle}
        disabled={busy}
        className={`text-[11px] px-3 py-1.5 rounded-full font-semibold ${
          state === "on"
            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
            : "bg-neon-purple text-white hover:bg-neon-purple/80"
        } disabled:opacity-50`}
      >
        {busy ? "..." : state === "on" ? "Унтраах" : "Идэвхжүүлэх"}
      </button>
    </div>
  );
}
