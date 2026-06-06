"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface FriendLocation {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  equippedFrameValue?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  updatedAt: string; // ISO
}

interface MapViewProps {
  locations: FriendLocation[];
  myPosition: { lat: number; lng: number; accuracy?: number | null } | null;
  me?: { displayName: string; avatarUrl: string | null; equippedFrameValue?: string | null } | null;
  focusUserId?: string | null;
  onFocused?: () => void;
}

const TILES = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

function timeAgo(iso: string): { label: string; live: boolean } {
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 90) return { label: "live", live: true };
  const m = Math.floor(s / 60);
  if (m < 60) return { label: `${m}м`, live: false };
  const h = Math.floor(m / 60);
  if (h < 24) return { label: `${h}ц`, live: false };
  const d = Math.floor(h / 24);
  return { label: `${d}ө`, live: false };
}

function frameRingHtml(frame: string | null | undefined): string {
  // Lightweight HTML "frame" representation for the leaflet div icon — we can't
  // mount React inside Leaflet, so we mimic the look with CSS animations.
  if (!frame) return "";
  const map: Record<string, { className: string; color: string }> = {
    "neon-ring":       { className: "frame-anim-pulse",   color: "rgba(124, 92, 255, 0.95)" },
    "rainbow-ring":    { className: "frame-anim-hue",     color: "rgba(255, 90, 180, 0.95)" },
    "fire-ring":       { className: "frame-anim-flicker", color: "rgba(255, 120, 0, 0.95)" },
    "ice-ring":        { className: "frame-anim-pulse",   color: "rgba(120, 220, 255, 0.95)" },
    "gold-spin":       { className: "frame-anim-spin",    color: "rgba(245, 196, 81, 0.95)" },
    "sparkle":         { className: "frame-anim-sparkle", color: "rgba(245, 196, 81, 0.95)" },
  };
  const f = map[frame];
  if (!f) return "";
  return `<span class="map-marker__frame ${f.className}" style="--map-frame-color: ${f.color}"></span>`;
}

function avatarHtml(
  displayName: string,
  avatarUrl: string | null,
  isSelf: boolean,
  ageLabel: string,
  live: boolean,
  frame: string | null | undefined,
): string {
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();
  const inner = avatarUrl
    ? `<img src="${escapeAttr(avatarUrl)}" alt="" class="map-marker__img" />`
    : `<span class="map-marker__initial">${escapeHtml(initial)}</span>`;

  const selfClass = isSelf ? "map-marker--self" : "map-marker--friend";
  const liveClass = live ? " map-marker--live" : "";
  const pulse = live ? `<span class="map-marker__pulse"></span>` : "";
  const ring = frameRingHtml(frame);
  const status = `<span class="map-marker__status ${live ? "is-live" : ""}">${escapeHtml(ageLabel)}</span>`;
  const name = `<span class="map-marker__name">${escapeHtml(displayName)}</span>`;

  return `
    <div class="map-marker ${selfClass}${liveClass}">
      ${pulse}
      <div class="map-marker__bubble">
        ${ring}
        <div class="map-marker__avatar">${inner}</div>
      </div>
      ${name}
      ${status}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function makeAvatarIcon(opts: {
  displayName: string;
  avatarUrl: string | null;
  isSelf: boolean;
  ageLabel: string;
  live: boolean;
  frame: string | null | undefined;
}): L.DivIcon {
  return L.divIcon({
    className: "map-marker-wrap",
    html: avatarHtml(opts.displayName, opts.avatarUrl, opts.isSelf, opts.ageLabel, opts.live, opts.frame),
    iconSize: [80, 110],
    iconAnchor: [40, 80],
    popupAnchor: [0, -78],
  });
}

function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
    const obs = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/** Re-tick state every 30s so "Xм ago" labels stay fresh and markers can re-render. */
function useTick(ms = 30_000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function FlyToTarget({
  target,
  onDone,
}: {
  target: { lat: number; lng: number; zoom?: number } | null;
  onDone?: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? Math.max(16, map.getZoom()), {
      duration: 0.9,
      easeLinearity: 0.25,
    });
    if (onDone) {
      const t = setTimeout(onDone, 950);
      return () => clearTimeout(t);
    }
  }, [target, map, onDone]);
  return null;
}

function AutoFitOnce({
  positions,
}: {
  positions: [number, number][];
}) {
  const map = useMap();
  const did = useRef(false);
  useEffect(() => {
    if (did.current) return;
    if (positions.length < 2) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    did.current = true;
  }, [positions, map]);
  return null;
}

export default function MapView({
  locations,
  myPosition,
  me,
  focusUserId,
  onFocused,
}: MapViewProps) {
  const isDark = useIsDark();
  useTick(30_000);

  const myDisplay = me?.displayName ?? "Me";
  const myAvatar = me?.avatarUrl ?? null;
  const myFrame = me?.equippedFrameValue ?? null;

  const center: [number, number] = myPosition
    ? [myPosition.lat, myPosition.lng]
    : locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [47.9184, 106.9177];

  const allPositions: [number, number][] = useMemo(() => {
    const arr: [number, number][] = locations.map((l) => [l.latitude, l.longitude]);
    if (myPosition) arr.push([myPosition.lat, myPosition.lng]);
    return arr;
  }, [locations, myPosition]);

  const focusTarget = useMemo(() => {
    if (!focusUserId) return null;
    if (focusUserId === "__me__" && myPosition) {
      return { lat: myPosition.lat, lng: myPosition.lng, zoom: 17 };
    }
    const f = locations.find((l) => l.userId === focusUserId);
    return f ? { lat: f.latitude, lng: f.longitude, zoom: 17 } : null;
  }, [focusUserId, locations, myPosition]);

  return (
    <MapContainer
      center={center}
      zoom={14}
      zoomControl={false}
      className="w-full h-full"
      style={{ background: isDark ? "#07070A" : "#f8f8f8" }}
    >
      <TileLayer
        attribution=""
        url={isDark ? TILES.dark : TILES.light}
      />

      <AutoFitOnce positions={allPositions} />
      <FlyToTarget target={focusTarget} onDone={onFocused} />

      {myPosition && (
        <>
          {myPosition.accuracy && myPosition.accuracy > 0 && myPosition.accuracy < 500 && (
            <Circle
              center={[myPosition.lat, myPosition.lng]}
              radius={myPosition.accuracy}
              pathOptions={{
                color: "#7C5CFF",
                weight: 1,
                opacity: 0.6,
                fillColor: "#7C5CFF",
                fillOpacity: 0.08,
              }}
            />
          )}
          <Marker
            position={[myPosition.lat, myPosition.lng]}
            icon={makeAvatarIcon({
              displayName: myDisplay,
              avatarUrl: myAvatar,
              isSelf: true,
              ageLabel: "live",
              live: true,
              frame: myFrame,
            })}
            zIndexOffset={1000}
          />
        </>
      )}

      {locations.map((loc) => {
        const t = timeAgo(loc.updatedAt);
        return (
          <Marker
            key={loc.userId}
            position={[loc.latitude, loc.longitude]}
            icon={makeAvatarIcon({
              displayName: loc.displayName,
              avatarUrl: loc.avatarUrl,
              isSelf: false,
              ageLabel: t.label,
              live: t.live,
              frame: loc.equippedFrameValue,
            })}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{loc.displayName}</div>
                <div className="opacity-70">@{loc.username}</div>
                <div className="opacity-70 mt-1">
                  {t.live ? "Live now" : `Updated ${t.label} ago`}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
