"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "" });
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      if (data.needsVerification) {
        toast.success("Баталгаажуулах код илгээлээ!");
        router.push(`/verify?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.success("Account created!");
      router.push("/dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { id: "email", label: "Email", type: "email", placeholder: "you@email.com" },
    { id: "username", label: "Username", type: "text", placeholder: "your_username" },
    { id: "displayName", label: "Display Name", type: "text", placeholder: "Your Name" },
    { id: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
  ];

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8 relative">
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
            Create your account to start questing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="game-card p-6 space-y-4">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              <input
                type={f.type}
                value={form[f.id as keyof typeof form]}
                onChange={(e) => update(f.id, e.target.value)}
                required
                minLength={f.id === "password" ? 6 : undefined}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 focus:border-neon-purple transition-all placeholder:text-muted-foreground/50"
                placeholder={f.placeholder}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-game w-full text-center"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-neon-purple font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
