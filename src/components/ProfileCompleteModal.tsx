"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/swr";
import { toast } from "sonner";
import AvatarUpload from "@/components/AvatarUpload";

const INTERESTS = [
  { emoji: "🏃", label: "Гадаа спорт" },
  { emoji: "🎮", label: "Тоглоом" },
  { emoji: "📚", label: "Уншлага" },
  { emoji: "🎵", label: "Хөгжим" },
  { emoji: "🍕", label: "Хоол хийх" },
  { emoji: "✈️", label: "Аялал" },
  { emoji: "🎨", label: "Урлаг" },
  { emoji: "💪", label: "Фитнесс" },
  { emoji: "🎬", label: "Кино" },
  { emoji: "🧩", label: "Оюун ухаан" },
  { emoji: "💻", label: "Технологи & Код" },
  { emoji: "📸", label: "Гэрэл зураг" },
  { emoji: "☕", label: "Кофе" },
  { emoji: "🎤", label: "Караоке" },
  { emoji: "🚗", label: "Авто машин" },
  { emoji: "🍿", label: "Анимэ & Манга" },
  { emoji: "🐾", label: "Амьтанд хайртай" },
  { emoji: "💄", label: "Грим & Бьюти" },
  { emoji: "📈", label: "Бизнес & Санхүү" },
  { emoji: "🧘", label: "Иог & Бясалгал" },
];

interface Props {
  mode?: "complete" | "edit";
  open?: boolean;
  onClose?: () => void;
}

export default function ProfileCompleteModal({ mode = "complete", open, onClose }: Props) {
  const { user, isLoading, mutate } = useUser();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = mode === "edit";
  const lastOpen = useRef(false);

  useEffect(() => {
    if (!user || !isEdit) return;
    if (open && !lastOpen.current) {
      lastOpen.current = true;
      setStep(0);
      setBio(user.bio ?? "");
      setBirthDate(user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : "");
      setPhone(user.phone ?? "");
      setSelected(user.interests ?? []);
    } else if (!open) {
      lastOpen.current = false;
    }
  }, [user, isEdit, open]);

  if (isLoading || !user) return null;
  if (isEdit && !open) return null;
  if (!isEdit && user.isProfileComplete) return null;

  function toggleInterest(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  }

  function goNext() {
    if (step === 1 && !birthDate) {
      toast.error("Төрсөн өдрөө оруулна уу");
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    if (selected.length < 2) {
      toast.error("Дор хаяж 2 сонирхол сонгоно уу");
      return;
    }
    if (!birthDate) {
      toast.error("Төрсөн өдрөө оруулна уу");
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate, phone, interests: selected, bio }),
      });
      if (!res.ok) throw new Error();
      await mutate(undefined, { revalidate: true });
      toast.success(isEdit ? "Профайл шинэчлэгдлээ!" : "Профайл амжилттай бүрдлээ!");
      if (isEdit) onClose?.();
    } catch {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  }

  const STEP_TITLES = [
    { title: "Профайл зураг & Bio", sub: "Өөрийгөө танилцуулна уу" },
    { title: "Үндсэн мэдээлэл", sub: "Төрсөн өдөр, утас" },
    { title: "Сонирхлоо сонго", sub: "Дор хаяж 2 сонирхол сонгоно уу" },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-[#14141C] border border-[#7C5CFF]/25">

        {/* Top accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#7C5CFF] via-[#2DD4FF] to-[#EC4899]" />

        {/* Step indicator + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-5 bg-[#7C5CFF]" : i < step ? "w-1.5 bg-[#7C5CFF]/60" : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">{step + 1} / 3</span>
            {isEdit && (
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-base font-bold text-[#E8E8F0]">{STEP_TITLES[step].title}</h2>
            <p className="text-xs mt-0.5 text-white/40">{STEP_TITLES[step].sub}</p>
          </div>

          {/* ── Step 0: Avatar + Bio ── */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-center pt-1">
                <AvatarUpload
                  avatarUrl={user.avatarUrl}
                  displayName={user.displayName}
                  size={88}
                  onUpload={(url) =>
                    mutate(
                      (curr: any) => ({ ...curr, user: { ...curr?.user, avatarUrl: url } }),
                      { revalidate: true }
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">
                  Bio <span className="text-white/20">({bio.length}/120)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 120))}
                  rows={3}
                  placeholder="Өөрийгөө товчхон танилцуулна уу..."
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#1C1C28] border border-white/10 text-[#E8E8F0] placeholder:text-white/25 outline-none transition-all focus:border-[#7C5CFF]/60 resize-none"
                />
              </div>

              <button onClick={goNext} className="btn-game w-full mt-2">
                Үргэлжлүүлэх →
              </button>
            </div>
          )}

          {/* ── Step 1: Birth + Phone ── */}
          {step === 1 && (
            <form
              onSubmit={(e) => { e.preventDefault(); goNext(); }}
              className="space-y-3 animate-fade-in"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">
                  Төрсөн өдөр <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#1C1C28] border border-white/10 text-[#E8E8F0] outline-none transition-all focus:border-[#7C5CFF]/60 [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">
                  Утас <span className="text-white/20">(заавал биш)</span>
                </label>
                <input
                  type="tel"
                  maxLength={8}
                  placeholder="99001234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#1C1C28] border border-white/10 text-[#E8E8F0] placeholder:text-white/25 outline-none transition-all focus:border-[#7C5CFF]/60"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#1C1C28] border border-white/10 text-white/60 transition-all hover:bg-white/5 active:scale-95"
                >
                  ←
                </button>
                <button type="submit" className="btn-game flex-1">
                  Үргэлжлүүлэх →
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Interests ── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {INTERESTS.map(({ emoji, label }) => {
                  const active = selected.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all duration-200 active:scale-95 ${active
                        ? "bg-[#7C5CFF]/15 border-[#7C5CFF]/60 text-[#E8E8F0] shadow-[0_0_12px_rgba(124,92,255,0.15)]"
                        : "bg-[#1C1C28] border-white/5 text-white/50 hover:border-white/10 hover:text-white/80"
                        } border`}
                    >
                      <span className="text-base leading-none">{emoji}</span>
                      <span className="leading-tight flex-1">{label}</span>
                      {active && (
                        <span className="text-[#7C5CFF] text-[10px] font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">
                  {selected.length} / {INTERESTS.length} сонгосон
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(selected.length, 5) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF] animate-pulse" />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#1C1C28] border border-white/10 text-white/60 transition-all hover:bg-white/5 active:scale-95"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || selected.length < 2}
                  className="btn-game flex-1 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {saving ? "Хадгалж байна..." : isEdit ? "Хадгалах ✓" : "Дуусгах ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
