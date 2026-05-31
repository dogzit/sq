"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

interface AchievementLike {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: string;
  xpReward: number;
  coinReward: number;
}

const rarityGlow: Record<string, string> = {
  COMMON: "shadow-[0_0_60px_rgba(160,160,180,0.5)]",
  RARE: "shadow-[0_0_80px_rgba(80,160,255,0.7)]",
  EPIC: "shadow-[0_0_100px_rgba(168,124,255,0.85)]",
  LEGENDARY: "shadow-[0_0_140px_rgba(255,200,50,1)]",
};

const rarityRing: Record<string, string> = {
  COMMON: "ring-white/30",
  RARE: "ring-neon-blue/60",
  EPIC: "ring-neon-purple/70",
  LEGENDARY: "ring-neon-gold/80",
};

const rarityText: Record<string, string> = {
  COMMON: "text-white",
  RARE: "text-neon-blue",
  EPIC: "text-neon-purple",
  LEGENDARY: "text-neon-gold",
};

const rarityLabel: Record<string, string> = {
  COMMON: "ACHIEVEMENT UNLOCKED",
  RARE: "RARE UNLOCK",
  EPIC: "EPIC UNLOCK",
  LEGENDARY: "LEGENDARY UNLOCK",
};

export function AchievementCelebration({
  achievement,
  onClose,
}: {
  achievement: AchievementLike | null;
  onClose: () => void;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (!achievement) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    fired.current = true;

    const colorsByRarity: Record<string, string[]> = {
      COMMON: ["#ffffff", "#cbd5e1", "#94a3b8"],
      RARE: ["#3b82f6", "#60a5fa", "#93c5fd"],
      EPIC: ["#a87cff", "#c4b5fd", "#7c3aed"],
      LEGENDARY: ["#fbbf24", "#fde68a", "#f59e0b", "#fff7ad"],
    };
    const colors = colorsByRarity[achievement.rarity] || colorsByRarity.COMMON;

    const burst = (opts: confetti.Options) =>
      confetti({
        spread: 90,
        ticks: 200,
        gravity: 0.9,
        decay: 0.93,
        startVelocity: 45,
        colors,
        ...opts,
      });

    // Initial big burst
    burst({ particleCount: 120, origin: { x: 0.5, y: 0.45 } });
    // Side bursts
    setTimeout(() => burst({ particleCount: 60, angle: 60, origin: { x: 0, y: 0.7 } }), 150);
    setTimeout(() => burst({ particleCount: 60, angle: 120, origin: { x: 1, y: 0.7 } }), 220);
    if (achievement.rarity === "EPIC" || achievement.rarity === "LEGENDARY") {
      setTimeout(() => burst({ particleCount: 80, origin: { x: 0.5, y: 0.4 } }), 500);
    }
    if (achievement.rarity === "LEGENDARY") {
      setTimeout(() => burst({ particleCount: 140, origin: { x: 0.5, y: 0.4 } }), 900);
    }

    // Auto-close after 4.5s
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key="celeb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
          onClick={onClose}
        >
          {/* Radial light beam */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                achievement.rarity === "LEGENDARY"
                  ? "radial-gradient(circle at center, rgba(255,200,50,0.35) 0%, transparent 60%)"
                  : achievement.rarity === "EPIC"
                  ? "radial-gradient(circle at center, rgba(168,124,255,0.3) 0%, transparent 60%)"
                  : achievement.rarity === "RARE"
                  ? "radial-gradient(circle at center, rgba(80,160,255,0.25) 0%, transparent 60%)"
                  : "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 60%)",
            }}
          />

          {/* Rotating starburst behind icon */}
          <motion.div
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 360, opacity: 0.35 }}
            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.6 } }}
            className="absolute w-[420px] h-[420px] pointer-events-none"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.18) 20deg, transparent 40deg, transparent 90deg, rgba(255,255,255,0.18) 110deg, transparent 130deg, transparent 180deg, rgba(255,255,255,0.18) 200deg, transparent 220deg, transparent 270deg, rgba(255,255,255,0.18) 290deg, transparent 310deg)",
              borderRadius: "50%",
              filter: "blur(8px)",
            }}
          />

          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className={`mb-4 text-xs font-mono font-bold tracking-[0.25em] ${rarityText[achievement.rarity] || "text-white"}`}
            >
              ★ {rarityLabel[achievement.rarity] || "ACHIEVEMENT UNLOCKED"} ★
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.05 }}
              className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-white/10 to-white/5 ring-4 ${
                rarityRing[achievement.rarity] || rarityRing.COMMON
              } ${rarityGlow[achievement.rarity] || rarityGlow.COMMON} flex items-center justify-center text-7xl backdrop-blur-sm`}
            >
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {achievement.iconEmoji}
              </motion.span>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 font-display text-3xl font-extrabold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              {achievement.name}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-sm text-white/70"
            >
              {achievement.description}
            </motion.p>

            {(achievement.xpReward > 0 || achievement.coinReward > 0) && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-5 flex items-center justify-center gap-3"
              >
                {achievement.xpReward > 0 && (
                  <div className="px-4 py-2 rounded-full bg-neon-purple/20 ring-1 ring-neon-purple/50 text-neon-purple font-mono font-bold text-sm">
                    +{achievement.xpReward} XP
                  </div>
                )}
                {achievement.coinReward > 0 && (
                  <div className="px-4 py-2 rounded-full bg-neon-gold/20 ring-1 ring-neon-gold/50 text-neon-gold font-mono font-bold text-sm">
                    +{achievement.coinReward} 🪙
                  </div>
                )}
              </motion.div>
            )}

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={onClose}
              className="mt-8 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white text-xs font-semibold tracking-wider transition-colors"
            >
              ҮРГЭЛЖЛҮҮЛЭХ
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
