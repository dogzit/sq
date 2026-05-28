import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-7xl font-bold neon-glow text-[var(--neon-cyan)] mb-4">404</div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Quest Not Found
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          This area hasn&apos;t been discovered yet.
        </p>
        <Link href="/dashboard" className="btn-neon inline-block">
          Return to Base
        </Link>
      </div>
    </div>
  );
}
