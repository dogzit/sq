"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin/AdminProvider";
import { fieldInput, fieldLabel } from "@/lib/admin/styles";

export default function AdminBroadcastPage() {
  const { data } = useAdmin();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lobbyId, setLobbyId] = useState<string>("ALL");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!title || !body) {
      toast.error("Title болон body шаардлагатай");
      return;
    }
    setSending(true);
    try {
      const r = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          lobbyId: lobbyId === "ALL" ? null : lobbyId,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d.error || "Алдаа");
        return;
      }
      toast.success(`${d.sent} хэрэглэгчид илгээлээ`);
      setTitle("");
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="game-card p-4 space-y-3">
        <div className="space-y-1">
          <label className={fieldLabel}>Хаашаа</label>
          <select
            value={lobbyId}
            onChange={(e) => setLobbyId(e.target.value)}
            className={fieldInput}
          >
            <option value="ALL">Бүх хэрэглэгч</option>
            {data?.lobbies.map((l) => (
              <option key={l.id} value={l.id}>
                Lobby: {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={fieldLabel}>Гарчиг</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className={fieldInput}
          />
        </div>

        <div className="space-y-1">
          <label className={fieldLabel}>Текст</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification body"
            rows={4}
            className={`${fieldInput} resize-none`}
          />
        </div>

        <button
          onClick={send}
          disabled={sending || !title || !body}
          className="btn-game w-full text-sm"
        >
          {sending ? "Илгээж байна..." : "Илгээх"}
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Notification бүх хэрэглэгчид нэг ёрондоо нэг бүртгэгдэх тул сайтар бичнэ үү.
      </p>
    </div>
  );
}
