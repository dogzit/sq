"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="emoji-ring mx-auto mb-4 w-16 h-16 text-2xl">📡</div>
        <h1 className="font-display text-xl font-bold text-foreground mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
      </div>
    </div>
  );
}
