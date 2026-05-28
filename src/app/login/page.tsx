"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
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
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-glow text-[var(--neon-cyan)] mb-2">
            SIDEQUEST
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Enter the grid, warrior
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-primary)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full text-center disabled:opacity-50"
          >
            {loading ? "Connecting..." : "LOGIN"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
          New here?{" "}
          <Link href="/register" className="text-[var(--neon-magenta)] hover:neon-glow-magenta">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
