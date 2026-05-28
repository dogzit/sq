"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-glow text-[var(--neon-cyan)] mb-2">
            SIDEQUEST
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Join the quest, create your legend
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-cyber p-6 space-y-4">
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3 border border-red-400/30">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              required
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              placeholder="cyberwarrior99"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              required
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full text-center disabled:opacity-50"
          >
            {loading ? "Creating..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--neon-magenta)] hover:neon-glow-magenta">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
