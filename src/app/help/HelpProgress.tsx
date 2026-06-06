"use client";

import { useEffect, useState } from "react";

export default function HelpProgress() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      setProgress(p);
      setShowTop(doc.scrollTop > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-0.5 z-[60] pointer-events-none"
      >
        <div
          className="h-full bg-gradient-to-r from-neon-purple via-neon-blue to-neon-gold transition-[width] duration-150"
          style={{
            width: `${(progress * 100).toFixed(2)}%`,
            boxShadow: "0 0 10px rgba(124, 92, 255, 0.6)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-[60] w-11 h-11 rounded-full bg-background/85 backdrop-blur-xl border border-border text-foreground shadow-lg flex items-center justify-center transition-all hover:text-neon-purple ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        aria-label="Дээш буцах"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
