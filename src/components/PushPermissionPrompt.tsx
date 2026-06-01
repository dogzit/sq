"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  currentSubscription,
  notificationPermission,
  pushSupported,
  subscribeToPush,
} from "@/lib/push-client";

const DISMISSED_KEY = "push:prompt:dismissed";

/**
 * Slide-up prompt asking the user to enable push notifications.
 * Shows once per dismissal: hidden if user has already granted, blocked,
 * or clicked "Дараа".
 */
export default function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return;
      const perm = notificationPermission();
      if (perm !== "default") return; // granted/denied — nothing to do
      if (localStorage.getItem(DISMISSED_KEY)) return;

      // If a subscription already exists (somehow) skip prompting
      const sub = await currentSubscription();
      if (sub) return;

      // Small delay so it doesn't appear during page transition
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    })();
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  async function enable() {
    setBusy(true);
    try {
      const res = await subscribeToPush();
      if (res.ok) {
        toast.success("Push notification идэвхжлээ");
        setVisible(false);
      } else {
        toast.error(res.message);
        // Hide only if there's nothing the user can do right now
        if (res.reason === "unsupported" || res.reason === "ios-needs-install") {
          setVisible(false);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="game-card p-4 ring-1 ring-neon-purple/30 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">🔔</div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold mb-0.5">
                  Notification идэвхжүүлэх үү?
                </div>
                <div className="text-xs text-muted-foreground">
                  Найз нэмэх, quest баталгаажих, lobby chat — утсанд тань шууд ирнэ.
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={dismiss}
                disabled={busy}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-secondary text-muted-foreground hover:bg-secondary/80 transition disabled:opacity-50"
              >
                Дараа
              </button>
              <button
                onClick={enable}
                disabled={busy}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-neon-purple text-white hover:bg-neon-purple/80 transition disabled:opacity-50"
              >
                {busy ? "..." : "Идэвхжүүлэх"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
