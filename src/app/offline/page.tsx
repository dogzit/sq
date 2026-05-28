"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold neon-glow text-[var(--neon-cyan)] mb-3">
          OFFLINE
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Холболт тасарсан байна. Интернэтэд холбогдоод дахин оролдоно уу.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-neon"
        >
          Дахин оролдох
        </button>
      </div>
    </div>
  );
}
