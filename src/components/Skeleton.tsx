export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card-cyber p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-[var(--bg-primary)] rounded w-3/4 mb-3" />
      <div className="h-3 bg-[var(--bg-primary)] rounded w-1/2 mb-2" />
      <div className="h-3 bg-[var(--bg-primary)] rounded w-1/3" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="card-cyber p-6 animate-pulse text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-[var(--bg-primary)] mb-3" />
      <div className="h-5 bg-[var(--bg-primary)] rounded w-32 mx-auto mb-2" />
      <div className="h-3 bg-[var(--bg-primary)] rounded w-24 mx-auto mb-5" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-8 bg-[var(--bg-primary)] rounded mb-1" />
            <div className="h-2 bg-[var(--bg-primary)] rounded w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
