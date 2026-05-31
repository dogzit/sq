"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/lib/swr";
import { adminMutate } from "./api";
import type { AdminData, DeleteTarget } from "./types";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type AdminContextValue = {
  data: AdminData | null;
  error: string;
  reload: () => Promise<void>;
  requestDelete: (target: DeleteTarget) => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/admin");
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      if (r.status === 403) {
        setError("Access denied");
        return;
      }
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setError(body.error || `HTTP ${r.status}`);
        return;
      }
      const json: AdminData = await r.json();
      setData(json);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сүлжээний алдаа");
    }
  }, [router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.isAdmin) {
      setError("Access denied");
      return;
    }
    reload();
  }, [user, userLoading, reload, router]);

  const requestDelete = useCallback(
    (t: DeleteTarget) => setConfirmDelete(t),
    [],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      const res = await adminMutate("DELETE", {
        type: confirmDelete.type,
        id: confirmDelete.id,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Устгахад алдаа гарлаа");
        return;
      }
      toast.success("Амжилттай устгалаа");
      setConfirmDelete(null);
      reload();
    } catch {
      toast.error("Сүлжээний алдаа гарлаа");
    }
  }, [confirmDelete, reload]);

  return (
    <AdminContext.Provider value={{ data, error, reload, requestDelete }}>
      {children}
      {confirmDelete && (
        <DeleteConfirmModal
          target={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </AdminContext.Provider>
  );
}
