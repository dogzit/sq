"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  }

  async function handleVerify(codeStr?: string) {
    const finalCode = codeStr || code.join("");
    if (finalCode.length !== 6) {
      toast.error("6 оронтой код оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Код буруу байна");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success("Баталгаажлаа!");
      router.push("/dashboard");
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResending(true);

    try {
      await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("Шинэ код илгээлээ!");
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Илгээж чадсангүй");
    } finally {
      setResending(false);
    }
  }

  if (!email) return null;

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
          <div className="text-5xl mb-4">📬</div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Код оруулна уу
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            <span className="text-foreground font-medium">{email}</span> руу 6 оронтой код илгээлээ
          </p>
        </div>

        <div className="game-card p-6 space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-11 h-13 text-center text-xl font-mono font-bold bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all"
              />
            ))}
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={loading || code.some((d) => !d)}
            className="btn-game w-full text-center"
          >
            {loading ? "Шалгаж байна..." : "Баталгаажуулах"}
          </button>
        </div>

        <div className="text-center mt-5">
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="text-sm text-muted-foreground hover:text-neon-purple transition-colors disabled:opacity-50"
          >
            {countdown > 0
              ? `Дахин илгээх (${countdown}с)`
              : resending
                ? "Илгээж байна..."
                : "Код ирээгүй? Дахин илгээх"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
