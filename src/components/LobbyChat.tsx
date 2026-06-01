"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import { useUser } from "@/lib/swr";
import { getPusherClient, lobbyChannelName } from "@/lib/pusher-client";

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    equippedFrameValue?: string | null;
  };
  replyTo?: {
    id: string;
    body: string;
    user: { id: string; username: string; displayName: string };
  } | null;
}

function renderBodyWithMentions(body: string) {
  const parts = body.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <span key={i} className="font-semibold underline">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function LobbyChat({ lobbyId }: { lobbyId: string }) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/lobbies/${lobbyId}/messages`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setMessages(d.messages || []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [lobbyId]);

  // Live updates via Pusher
  useEffect(() => {
    const client = getPusherClient();
    if (!client) return;
    const channel = client.subscribe(lobbyChannelName(lobbyId));
    const onNew = (m: ChatMessage) => {
      setMessages((prev) => (prev.find((p) => p.id === m.id) ? prev : [...prev, m]));
    };
    channel.bind("chat:new", onNew);
    return () => {
      channel.unbind("chat:new", onNew);
      client.unsubscribe(lobbyChannelName(lobbyId));
    };
  }, [lobbyId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/lobbies/${lobbyId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, replyToId: replyTo?.id ?? null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || `Илгээж чадсангүй (${res.status})`);
        return;
      }
      setDraft("");
      setReplyTo(null);
      if (d.message) {
        setMessages((prev) =>
          prev.find((p) => p.id === d.message.id) ? prev : [...prev, d.message]
        );
      }
    } finally {
      setSending(false);
    }
  }

  function startReply(m: ChatMessage) {
    setReplyTo(m);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[60vh] game-card">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-8 animate-pulse">
            Ачаалж байна...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-12">
            💬 Эхний зурвасаа бичээрэй
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.user.id === user?.id;
            const prev = messages[i - 1];
            const showAvatar = !prev || prev.user.id !== m.user.id;
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
              >
                <div className="w-7 flex-shrink-0">
                  {showAvatar && !mine && <UserAvatar user={m.user} size={28} />}
                </div>
                <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col group`}>
                  {showAvatar && !mine && (
                    <div className="text-[10px] text-muted-foreground mb-0.5 px-1">
                      {m.user.displayName}
                    </div>
                  )}
                  {m.replyTo && (
                    <div
                      className={`text-[10px] mb-0.5 px-2 py-1 rounded-lg border-l-2 max-w-full ${
                        mine
                          ? "bg-neon-purple/10 border-neon-purple/60 text-neon-purple/80"
                          : "bg-secondary/60 border-muted-foreground/40 text-muted-foreground"
                      }`}
                    >
                      <div className="font-semibold truncate">↪ {m.replyTo.user.displayName}</div>
                      <div className="truncate opacity-80">{m.replyTo.body}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {mine && (
                      <button
                        onClick={() => startReply(m)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground hover:text-foreground transition"
                        aria-label="Reply"
                      >
                        ↩
                      </button>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm break-words ${
                        mine
                          ? "bg-neon-purple text-white rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      {renderBodyWithMentions(m.body)}
                    </div>
                    {!mine && (
                      <button
                        onClick={() => startReply(m)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground hover:text-foreground transition"
                        aria-label="Reply"
                      >
                        ↩
                      </button>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {replyTo && (
        <div className="px-3 py-2 border-t border-border bg-neon-purple/5 flex items-center gap-2">
          <div className="border-l-2 border-neon-purple/60 pl-2 flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-neon-purple">
              ↪ {replyTo.user.displayName}-д хариулж байна
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{replyTo.body}</div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="w-6 h-6 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80"
            aria-label="Болих"
          >
            ✕
          </button>
        </div>
      )}
      <form
        onSubmit={send}
        className="flex gap-2 p-2 border-t border-border bg-background/50"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={replyTo ? `${replyTo.user.displayName}-д хариулах...` : "Зурвас бичих... (@username)"}
          maxLength={500}
          className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/40 placeholder:text-muted-foreground/50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="px-4 py-2 rounded-full bg-neon-purple text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-95"
        >
          {sending ? "..." : "→"}
        </button>
      </form>
    </div>
  );
}
