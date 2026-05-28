"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    setShow(false);
  }

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setShow(false);
  }

  if (!show || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-4 right-4 z-[60] max-w-lg mx-auto"
      >
        <div className="game-card p-4 flex items-center gap-3 ring-1 ring-neon-purple/20 glow-purple">
          <div className="text-2xl">📲</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Install SideQuest</h3>
            <p className="text-xs text-muted-foreground">Add to home screen</p>
          </div>
          <div className="flex gap-2">
            <button onClick={dismiss} className="btn-game-outline text-xs !py-1.5 !px-3">
              Later
            </button>
            <button onClick={handleInstall} className="btn-game text-xs !py-1.5 !px-3">
              Install
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
