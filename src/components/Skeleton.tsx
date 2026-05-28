export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`game-card p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton-shimmer rounded-lg w-3/4" />
          <div className="h-3 skeleton-shimmer rounded-lg w-1/2" />
        </div>
      </div>
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
    <div className="game-card p-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl skeleton-shimmer mb-4" />
      <div className="h-5 skeleton-shimmer rounded-lg w-32 mx-auto mb-2" />
      <div className="h-3 skeleton-shimmer rounded-lg w-24 mx-auto mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 skeleton-shimmer rounded-lg" />
            <div className="h-2 skeleton-shimmer rounded-lg w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
