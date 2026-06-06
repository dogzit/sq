"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import UserAvatar from "@/components/UserAvatar";
import { FadeIn } from "@/components/AnimatedList";
import { useLobbies, useLocations, useUser } from "@/lib/swr";
import { getPusherClient, lobbyChannelName } from "@/lib/pusher-client";
import type { FriendLocation } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const SHARE_THROTTLE_MS = 8_000; // don't POST more often than this

type IncomingLocation = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  equippedFrameValue?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  updatedAt: string;
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 90) return "live";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ц`;
  return `${Math.floor(h / 24)}ө`;
}

export default function MapPage() {
  const { user } = useUser();
  const { lobbies } = useLobbies();
  const [selectedLobby, setSelectedLobby] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number; accuracy?: number | null } | null>(null);
  const [focusUserId, setFocusUserId] = useState<string | null>(null);

  const lobbyId = selectedLobby || lobbies?.[0]?.id || "";
  const { locations, fogOfWar, isLoading, mutate } = useLocations(lobbyId);

  // ── Live overlay: incoming updates from Pusher get merged on top of the SWR cache ──
  const [liveMap, setLiveMap] = useState<Record<string, IncomingLocation>>({});

  useEffect(() => {
    // Reset live cache whenever lobby changes
    setLiveMap({});
  }, [lobbyId]);

  // Default to first lobby
  useEffect(() => {
    if (!selectedLobby && lobbies?.length > 0) setSelectedLobby(lobbies[0].id);
  }, [lobbies, selectedLobby]);

  // ─────────────────────────────────────────────
  // PUSHER SUBSCRIPTION
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!lobbyId || fogOfWar) return;
    const client = getPusherClient();
    if (!client) return;

    const channelName = lobbyChannelName(lobbyId);
    const channel = client.subscribe(channelName);

    const onUpdate = (p: IncomingLocation) => {
      if (!p?.userId) return;
      setLiveMap((prev) => ({ ...prev, [p.userId]: p }));
    };
    const onOffline = (p: { userId: string }) => {
      if (!p?.userId) return;
      setLiveMap((prev) => {
        const next = { ...prev };
        delete next[p.userId];
        return next;
      });
    };

    channel.bind("location:update", onUpdate);
    channel.bind("location:offline", onOffline);

    return () => {
      channel.unbind("location:update", onUpdate);
      channel.unbind("location:offline", onOffline);
      client.unsubscribe(channelName);
    };
  }, [lobbyId, fogOfWar]);

  // ─────────────────────────────────────────────
  // LOCATION SHARING — geolocation watcher
  // ─────────────────────────────────────────────
  const watchIdRef = useRef<number | null>(null);
  const lastPostRef = useRef<number>(0);

  const postLocation = useCallback(
    async (lat: number, lng: number, acc: number | null, heading: number | null, speed: number | null) => {
      const now = Date.now();
      if (now - lastPostRef.current < SHARE_THROTTLE_MS) return;
      lastPostRef.current = now;
      await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          accuracy: acc ?? undefined,
          heading: heading ?? undefined,
          speed: speed ?? undefined,
        }),
      }).catch(() => {});
    },
    [],
  );

  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
    await fetch("/api/location", { method: "DELETE" }).catch(() => {});
  }, []);

  const startSharing = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Энэ төхөөрөмжид geolocation дэмжигдэхгүй");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        setMyPos({ lat: latitude, lng: longitude, accuracy });
        setSharing(true);
        postLocation(latitude, longitude, accuracy ?? null, heading ?? null, speed ?? null);
        toast.success("Байршил хуваалцаж эхэллээ");

        const id = navigator.geolocation.watchPosition(
          (p) => {
            const { latitude: lat, longitude: lng, accuracy: acc, heading: hd, speed: sp } = p.coords;
            setMyPos({ lat, lng, accuracy: acc });
            postLocation(lat, lng, acc ?? null, hd ?? null, sp ?? null);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
        );
        watchIdRef.current = id;
      },
      (err) => {
        toast.error(err.code === 1 ? "Байршил зөвшөөрөл өгөгдсөнгүй" : "Байршил авч чадсангүй");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }, [postLocation]);

  const toggleSharing = useCallback(() => {
    if (sharing) {
      stopSharing();
    } else {
      startSharing();
    }
  }, [sharing, startSharing, stopSharing]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────
  // MERGE: SWR snapshot + Pusher live overlay
  // ─────────────────────────────────────────────
  const mergedLocations: FriendLocation[] = useMemo(() => {
    const byId = new Map<string, FriendLocation>();
    for (const l of locations ?? []) {
      byId.set(l.userId, l as FriendLocation);
    }
    for (const [uid, p] of Object.entries(liveMap)) {
      // never display yourself in friends list — `myPos` carries that
      if (user && uid === user.id) continue;
      byId.set(uid, {
        userId: p.userId,
        username: p.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        equippedFrameValue: p.equippedFrameValue,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: p.accuracy ?? null,
        updatedAt: p.updatedAt,
      });
    }
    return Array.from(byId.values()).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [locations, liveMap, user]);

  // Re-tick every 20s so the "online" tally stays fresh even with no incoming events.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(id);
  }, []);

  const onlineCount = mergedLocations.filter(
    (l) => now - new Date(l.updatedAt).getTime() < 90_000,
  ).length;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden">
      <TopBar
        showBack
        title="Map"
        rightAction={
          <button
            onClick={toggleSharing}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
              sharing
                ? "bg-neon-green/15 text-neon-green ring-1 ring-neon-green/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {sharing ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                LIVE
              </>
            ) : (
              "Байршил хуваалцах"
            )}
          </button>
        }
      />

      <div className="px-4 pt-3 pb-2 flex-shrink-0 flex items-center gap-2">
        {(lobbies?.length ?? 0) > 0 && (
          <div className="relative flex-1">
            <select
              value={selectedLobby}
              onChange={(e) => setSelectedLobby(e.target.value)}
              className="w-full bg-secondary/80 backdrop-blur border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/40 appearance-none pr-9"
            >
              {(lobbies ?? []).map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              ▾
            </span>
          </div>
        )}
        <div className="text-[11px] font-mono px-3 py-2 rounded-xl bg-secondary/80 text-muted-foreground whitespace-nowrap">
          <span className="text-neon-green">●</span>{" "}
          <span className="text-foreground font-semibold">{onlineCount}</span>{" "}
          online
        </div>
      </div>

      {/* MAP */}
      <div className="relative flex-1 min-h-0">
        {(lobbies?.length ?? 0) === 0 ? (
          <EmptyState reason="no-lobby" />
        ) : fogOfWar && !isLoading ? (
          <>
            <MapView locations={[]} myPosition={myPos} me={user ? {
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
              equippedFrameValue: user.equippedFrameValue ?? null,
            } : null} />
            <FogOverlay />
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground animate-pulse font-display">Loading map...</div>
          </div>
        ) : (
          <MapView
            locations={mergedLocations}
            myPosition={myPos}
            me={user ? {
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
              equippedFrameValue: user.equippedFrameValue ?? null,
            } : null}
            focusUserId={focusUserId}
            onFocused={() => setFocusUserId(null)}
          />
        )}

        {/* Bottom carousel of friends */}
        {!fogOfWar && (mergedLocations.length > 0 || myPos) && (
          <FriendCarousel
            me={user ? {
              id: user.id,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
              equippedFrameValue: user.equippedFrameValue ?? null,
              live: !!myPos,
            } : null}
            friends={mergedLocations}
            onFocusMe={() => myPos && setFocusUserId("__me__")}
            onFocusFriend={(id) => setFocusUserId(id)}
          />
        )}

        {/* Recenter FAB */}
        {!fogOfWar && myPos && (
          <button
            onClick={() => setFocusUserId("__me__")}
            className="absolute top-3 right-3 z-[400] w-11 h-11 rounded-full bg-background/85 backdrop-blur-xl border border-border flex items-center justify-center text-foreground shadow-lg hover:text-neon-purple transition-colors"
            aria-label="Намайг харах"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────── */
/* Sub-components                             */
/* ────────────────────────────────────────── */

function FogOverlay() {
  return (
    <div className="absolute inset-0 z-[500] flex items-end justify-center p-4 pb-32 pointer-events-none">
      <FadeIn>
        <div className="game-card p-5 max-w-sm pointer-events-auto text-center backdrop-blur-xl bg-background/85 border-neon-purple/30">
          <div className="text-3xl mb-2">🌫️</div>
          <h3 className="font-display text-sm font-semibold">Fog of War</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Quest биелүүлээд approve хийлгэснээр найзуудын байршил <strong>1 цаг</strong> нээгдэнэ.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

function EmptyState({ reason }: { reason: "no-lobby" }) {
  if (reason === "no-lobby") {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="game-card p-8 max-w-sm text-center space-y-2">
          <div className="text-3xl">🗺️</div>
          <h3 className="font-display text-base font-bold">Lobby байхгүй</h3>
          <p className="text-xs text-muted-foreground">
            Map нь lobby-ийн гишүүдтэй байршил хуваалцах boломж. Эхлээд lobby үүсгэх эсвэл нэгдээрэй.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function FriendCarousel({
  me,
  friends,
  onFocusMe,
  onFocusFriend,
}: {
  me: { id: string; displayName: string; avatarUrl: string | null; equippedFrameValue: string | null; live: boolean } | null;
  friends: FriendLocation[];
  onFocusMe: () => void;
  onFocusFriend: (userId: string) => void;
}) {
  return (
    <div className="absolute bottom-3 left-0 right-0 z-[400] px-3 pointer-events-none">
      <div className="pointer-events-auto bg-background/75 backdrop-blur-xl border border-border/60 rounded-2xl p-2 shadow-2xl">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x">
          {me && (
            <CarouselCard
              isMe
              onClick={onFocusMe}
              displayName="Та"
              avatarUrl={me.avatarUrl}
              frame={me.equippedFrameValue}
              status={me.live ? "live" : "off"}
            />
          )}
          {friends.length === 0 && !me && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              Найз live байхгүй
            </div>
          )}
          {friends.map((f) => (
            <CarouselCard
              key={f.userId}
              displayName={f.displayName}
              avatarUrl={f.avatarUrl}
              frame={f.equippedFrameValue}
              status={timeAgo(f.updatedAt)}
              onClick={() => onFocusFriend(f.userId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CarouselCard({
  displayName,
  avatarUrl,
  frame,
  status,
  onClick,
  isMe,
}: {
  displayName: string;
  avatarUrl: string | null;
  frame?: string | null;
  status: string;
  onClick: () => void;
  isMe?: boolean;
}) {
  const live = status === "live";
  return (
    <button
      onClick={onClick}
      className="snap-start flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-secondary/60 transition-all active:scale-95"
      style={{ minWidth: 64 }}
    >
      <div className="relative">
        <UserAvatar
          user={{ displayName, avatarUrl, equippedFrameValue: frame ?? null }}
          size={40}
          linkToProfile={false}
        />
        {live && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-background animate-pulse" />
        )}
        {isMe && (
          <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full bg-neon-purple text-white">
            ME
          </span>
        )}
      </div>
      <div className="text-[10px] font-semibold text-foreground max-w-[64px] truncate">
        {displayName}
      </div>
      <div
        className={`text-[9px] font-mono uppercase tracking-wide ${
          live ? "text-neon-green" : "text-muted-foreground"
        }`}
      >
        {status}
      </div>
    </button>
  );
}
