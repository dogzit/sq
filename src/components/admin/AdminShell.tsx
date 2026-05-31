"use client";

import TopBar from "@/components/TopBar";
import { useAdmin } from "@/lib/admin/AdminProvider";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data, error } = useAdmin();

  if (error) {
    const isAccessDenied = error === "Access denied";
    return (
      <>
        <TopBar title="Admin" showBack />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="game-card p-8 text-center max-w-sm">
            <div className="text-4xl mb-3">{isAccessDenied ? "🔒" : "⚠️"}</div>
            <h2 className="font-display text-lg font-bold mb-1">
              {isAccessDenied ? "Access Denied" : "Алдаа гарлаа"}
            </h2>
            <p className="text-sm text-muted-foreground break-words">
              {isAccessDenied ? "You don't have admin privileges." : error}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar title="Admin" showBack />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground animate-pulse font-display">
            Loading admin panel...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Admin Panel" showBack />
      <div className="px-4 py-4 max-w-2xl mx-auto pb-24">{children}</div>
    </>
  );
}
