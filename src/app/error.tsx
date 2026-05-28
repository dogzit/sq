"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">⚡</div>
        <h1 className="text-2xl font-bold neon-glow text-[var(--neon-cyan)] mb-3">
          SYSTEM ERROR
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Something unexpected happened. Try again.
        </p>
        <button onClick={reset} className="btn-neon">
          Try Again
        </button>
      </div>
    </div>
  );
}
