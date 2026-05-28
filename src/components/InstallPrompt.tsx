"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Show again after 7 days
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
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShow(false);
  }

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setShow(false);
  }

  if (!show || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] max-w-lg mx-auto animate-in slide-in-from-bottom">
      <div className="card-cyber neon-border p-4 flex items-center gap-3">
        <div className="text-3xl">📲</div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[var(--neon-cyan)]">Install SideQuest</h3>
          <p className="text-xs text-[var(--text-secondary)]">Add to home screen for the best experience</p>
        </div>
        <div className="flex gap-2">
          <button onClick={dismiss} className="text-xs text-[var(--text-secondary)] px-2 py-1">
            Later
          </button>
          <button onClick={handleInstall} className="btn-neon text-xs !py-2 !px-4">
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
