"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

type Step = "email" | "code" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send code");
        return;
      }
      toast.success("Нууц үг сэргээх код илгээлээ");
      setStep("code");
      setCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-advance when all digits filled
    if (next.every((d) => d !== "")) {
      setStep("password");
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      setStep("password");
    }
  }

  async function resetPassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Нууц үг таарахгүй байна");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Нууц үг хамгийн багадаа 6 тэмдэгт");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: digits.join(""),
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Reset failed");
        if (data.error?.includes("Код")) {
          setStep("code");
          setDigits(["", "", "", "", "", ""]);
        }
        return;
      }

      toast.success("Нууц үг амжилттай солигдлоо!");
      router.push("/dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (cooldown > 0) return;
    setCooldown(60);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("Код дахин илгээлээ");
    } catch {
      toast.error("Илгээж чадсангүй");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Side<span className="text-neon-purple">Quest</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Нууц үг сэргээх
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="game-card p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email хаяг</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>
              <button
                onClick={sendCode}
                disabled={loading || !email}
                className="btn-game w-full text-center"
              >
                {loading ? "Илгээж байна..." : "Код илгээх"}
              </button>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="game-card p-6 space-y-5"
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{email}</span> руу код илгээлээ
                </p>
              </div>

              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-13 text-center text-xl font-bold bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all"
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={resendCode}
                  disabled={cooldown > 0}
                  className="text-xs text-muted-foreground hover:text-neon-purple transition-colors disabled:opacity-50"
                >
                  {cooldown > 0 ? `Дахин илгээх (${cooldown}с)` : "Код дахин илгээх"}
                </button>
              </div>

              <button
                onClick={() => {
                  if (digits.every((d) => d !== "")) setStep("password");
                  else toast.error("6 оронтой код оруулна уу");
                }}
                className="btn-game w-full text-center"
              >
                Үргэлжлүүлэх
              </button>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="game-card p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Шинэ нууц үг</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Хамгийн багадаа 6 тэмдэгт"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Нууц үг давтах</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Дахин оруулна уу"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
              <button
                onClick={resetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="btn-game w-full text-center"
              >
                {loading ? "Хадгалж байна..." : "Нууц үг солих"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mt-5">
          <Link href="/login" className="text-neon-purple font-medium hover:underline">
            Нэвтрэх хуудас руу буцах
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
