"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  avatarUrl?: string | null;
  displayName?: string;
  size?: number;
  onUpload?: (url: string) => void;
}

export default function AvatarUpload({ avatarUrl, displayName = "?", size = 80, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Зөвхөн зураг сонгоно уу");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Зураг 5MB-аас бага байх ёстой");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/upload-pfp", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Алдаа гарлаа");
      toast.success("Профайл зураг шинэчлэгдлээ!");
      onUpload?.(data.avatarUrl);
      setPreview(null);
    } catch (e: any) {
      toast.error(e.message ?? "Хуулж чадсангүй");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const src = preview ?? avatarUrl;
  const initials = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative group focus:outline-none"
        style={{ width: size, height: size }}
        aria-label="Профайл зураг солих"
      >
        {/* Avatar circle */}
        <div
          className="w-full h-full rounded-full overflow-hidden ring-2 ring-cyan-500/40 ring-offset-2 ring-offset-gray-950 transition-all group-hover:ring-cyan-400/70 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.25)]"
        >
          {src ? (
            <img
              src={src}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-600/30 to-purple-600/30 flex items-center justify-center text-white font-bold"
              style={{ fontSize: size * 0.35 }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Overlay on hover / loading */}
        <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${
          uploading ? "opacity-100 bg-black/60" : "opacity-0 group-hover:opacity-100 bg-black/50"
        }`}>
          {uploading ? (
            <svg className="w-6 h-6 text-cyan-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "Хуулж байна..." : "Зураг солих"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
