"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/swr";

const BIRTHDAY_COINS = 100;

function isBirthdayToday(birthDate: string | Date | null | undefined): boolean {
  if (!birthDate) return false;
  const bd = new Date(birthDate);
  const today = new Date();
  return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
}

function getBirthdayKey(userId: string): string {
  return `bday_shown_${userId}_${new Date().toISOString().split("T")[0]}`;
}

export default function BirthdayPopup() {
  const { user, isLoading } = useUser();
  const [visible, setVisible] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (isLoading || !user?.isProfileComplete || !user?.birthDate) return;
    if (!isBirthdayToday(user.birthDate)) return;

    const key = getBirthdayKey(user.id);
    if (localStorage.getItem(key)) return;

    localStorage.setItem(key, "1");
    setVisible(true);

    fetch("/api/user/birthday-reward", { method: "POST" }).catch(() => {});

    if (confettiFired.current) return;
    confettiFired.current = true;

    import("canvas-confetti").then(({ default: confetti }) => {
      const end = Date.now() + 3500;
      const colors = ["#00ffff", "#a855f7", "#ec4899", "#facc15", "#ffffff"];

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    });
  }, [isLoading, user]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-yellow-400/40 bg-gray-950 shadow-[0_0_80px_rgba(250,204,21,0.15)] overflow-hidden text-center">
        {/* Rainbow top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400" />

        <div className="px-6 py-8">
          <div className="mb-4 text-6xl animate-bounce">🎂</div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Төрсөн өдрийн баярын мэнд хүргэе!
          </h2>

          <p className="mt-2 text-gray-400 text-sm">
            {user?.displayName ?? "Баатар"}, өнөөдөр таны онцгой өдөр!
          </p>

          {/* Coin reward */}
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
            <span className="text-2xl">🪙</span>
            <span className="text-lg font-bold text-yellow-300">
              +{BIRTHDAY_COINS} Coin бэлэглэлээ!
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Шагнал таны дансанд нэмэгдлээ
          </p>

          <button
            onClick={() => setVisible(false)}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-pink-500 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all hover:shadow-[0_0_35px_rgba(250,204,21,0.5)]"
          >
            Баярлалаа! 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
