"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Нэвтрэх боломжгүй байна");
        return;
      }

      if (data.needsVerification) {
        toast.info("Email баталгаажуулах код илгээлээ");
        router.push(`/verify?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.success("Тавтай морил!");
      router.push("/dashboard");
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    } finally {
      setLoading(false);
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
            Sign in to continue your adventure
          </p>
        </div>

        <form onSubmit={handleSubmit} className="game-card p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all placeholder:text-muted-foreground/50"
              placeholder="you@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all placeholder:text-muted-foreground/50"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-game w-full text-center"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-neon-purple transition-colors">
              Нууц үгээ мартсан?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-neon-purple font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
