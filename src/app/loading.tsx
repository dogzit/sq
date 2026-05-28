export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold neon-glow text-[var(--neon-cyan)] animate-pulse mb-2">
          SQ
        </div>
        <div className="text-xs text-[var(--text-secondary)]">Loading...</div>
      </div>
    </div>
  );
}
